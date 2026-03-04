import { NextRequest, NextResponse } from 'next/server'

type ChannelKey = 'telegram' | 'discord'
type ChannelMode = 'both' | ChannelKey

type ChannelResult = {
  success: boolean
  error: string
  skipped: boolean
}

type DeliveryResults = {
  telegram: ChannelResult
  discord: ChannelResult
}

const CHANNELS: ChannelKey[] = ['telegram', 'discord']
const TELEGRAM_MAX_MESSAGE = 4096
const DISCORD_MAX_MESSAGE = 2000
const DISCORD_MAX_FILES_PER_REQUEST = 10
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024
const REQUEST_TIMEOUT_MS = 600_000

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

function splitMessage(input: string, maxLength: number): string[] {
  if (input.length <= maxLength) return [input]

  const lines = input.split('\n')
  const chunks: string[] = []
  let current = ''

  const pushCurrent = () => {
    if (current.length > 0) {
      chunks.push(current)
      current = ''
    }
  }

  for (const line of lines) {
    if (line.length > maxLength) {
      const words = line.split(' ')
      for (const word of words) {
        if (word.length > maxLength) {
          pushCurrent()
          for (let i = 0; i < word.length; i += maxLength) {
            chunks.push(word.slice(i, i + maxLength))
          }
          continue
        }

        const separator = current.length === 0 ? '' : ' '
        if (current.length + separator.length + word.length > maxLength) {
          pushCurrent()
          current = word
        } else {
          current = current + separator + word
        }
      }
      pushCurrent()
      continue
    }

    const candidate = current.length === 0 ? line : `${current}\n${line}`
    if (candidate.length > maxLength) {
      pushCurrent()
      current = line
    } else {
      current = candidate
    }
  }

  pushCurrent()
  return chunks.length > 0 ? chunks : ['']
}

function parseChannelMode(value: FormDataEntryValue | null): ChannelMode {
  if (value === 'telegram' || value === 'discord' || value === 'both') {
    return value
  }
  return 'both'
}

function parseDiscordMaxFileSizeBytes(): number | null {
  const raw = process.env.DISCORD_MAX_FILE_SIZE_MB
  if (!raw) return null

  const mb = Number.parseInt(raw, 10)
  if (!Number.isFinite(mb) || mb <= 0) return null

  return mb * 1024 * 1024
}

function getSelectedChannels(mode: ChannelMode): ChannelKey[] {
  if (mode === 'both') return CHANNELS
  return [mode]
}

function formatChannelName(channel: ChannelKey): string {
  return channel === 'telegram' ? 'Telegram' : 'Discord'
}

function formatChannelList(channels: ChannelKey[]): string {
  if (channels.length === 0) return 'No channels'
  if (channels.length === 1) return formatChannelName(channels[0])
  return `${formatChannelName(channels[0])} and ${formatChannelName(channels[1])}`
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message
  return fallback
}

async function safeReadBody(response: Response): Promise<string> {
  try {
    return await response.text()
  } catch {
    return ''
  }
}

export async function POST(request: NextRequest) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { error: 'Invalid form data payload.' },
      { status: 400 },
    )
  }

  const rawMessage = formData.get('message')
  const message = typeof rawMessage === 'string' ? rawMessage.trim() : ''
  const files = formData
    .getAll('files')
    .filter((entry): entry is File => entry instanceof File)
  const channelMode = parseChannelMode(formData.get('channel'))
  const selectedChannels = getSelectedChannels(channelMode)
  const discordMaxFileSizeBytes = parseDiscordMaxFileSizeBytes()

  if (!message && files.length === 0) {
    return NextResponse.json(
      { error: 'Please provide a message or at least one file.' },
      { status: 400 },
    )
  }

  const oversizedFiles = files.filter((file) => file.size > MAX_FILE_SIZE_BYTES)
  if (oversizedFiles.length > 0) {
    return NextResponse.json(
      {
        error: `File size limit is 50MB per file. Oversized: ${oversizedFiles
          .map((file) => file.name)
          .join(', ')}`,
      },
      { status: 400 },
    )
  }

  if (
    selectedChannels.includes('discord') &&
    discordMaxFileSizeBytes !== null
  ) {
    const discordOversizedFiles = files.filter(
      (file) => file.size > discordMaxFileSizeBytes,
    )

    if (discordOversizedFiles.length > 0) {
      const maxMb = Math.round(discordMaxFileSizeBytes / (1024 * 1024))
      return NextResponse.json(
        {
          error: `Discord file size limit is ${maxMb}MB per file. Oversized: ${discordOversizedFiles
            .map((file) => file.name)
            .join(', ')}`,
        },
        { status: 400 },
      )
    }
  }

  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN
  const telegramChatId = process.env.TELEGRAM_CHAT_ID
  const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL

  if (
    selectedChannels.includes('telegram') &&
    (!telegramBotToken || !telegramChatId)
  ) {
    return NextResponse.json(
      {
        error:
          'Missing Telegram configuration. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.',
      },
      { status: 500 },
    )
  }

  if (selectedChannels.includes('discord') && !discordWebhookUrl) {
    return NextResponse.json(
      {
        error: 'Missing Discord configuration. Set DISCORD_WEBHOOK_URL.',
      },
      { status: 500 },
    )
  }

  const selectedSet = new Set(selectedChannels)
  const results: DeliveryResults = {
    telegram: {
      success: false,
      error: '',
      skipped: !selectedSet.has('telegram'),
    },
    discord: {
      success: false,
      error: '',
      skipped: !selectedSet.has('discord'),
    },
  }

  if (selectedSet.has('telegram')) {
    try {
      if (message) {
        const telegramMessage = message.slice(0, TELEGRAM_MAX_MESSAGE)
        const response = await fetchWithTimeout(
          `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: telegramChatId,
              text: telegramMessage,
              disable_web_page_preview: true,
            }),
          },
        )

        const body = await response.json()
        if (!response.ok || !body?.ok) {
          results.telegram.error =
            body?.description || 'Failed to send message to Telegram.'
        }
      }

      for (const file of files) {
        if (results.telegram.error) break

        const telegramFormData = new FormData()
        telegramFormData.append('chat_id', telegramChatId!)
        telegramFormData.append('document', file, file.name)

        const response = await fetchWithTimeout(
          `https://api.telegram.org/bot${telegramBotToken}/sendDocument`,
          {
            method: 'POST',
            body: telegramFormData,
          },
        )

        const body = await response.json()
        if (!response.ok || !body?.ok) {
          results.telegram.error =
            body?.description || `Failed to send "${file.name}" to Telegram.`
        }
      }

      if (!results.telegram.error) {
        results.telegram.success = true
      }
    } catch (error) {
      results.telegram.error = toErrorMessage(error, 'Telegram request failed.')
    }
  }

  if (selectedSet.has('discord')) {
    try {
      const messageChunks = message ? splitMessage(message, DISCORD_MAX_MESSAGE) : []
      const fileChunks = chunkArray(files, DISCORD_MAX_FILES_PER_REQUEST)
      const iterations = Math.max(messageChunks.length, fileChunks.length)

      if (iterations === 0) {
        results.discord.success = true
      } else {
        for (let i = 0; i < iterations; i++) {
          const content = messageChunks[i] ?? ''
          const currentFileChunk = fileChunks[i] ?? []

          if (!content && currentFileChunk.length === 0) continue

          const discordFormData = new FormData()
          if (content) {
            discordFormData.append('payload_json', JSON.stringify({ content }))
          }

          currentFileChunk.forEach((file, index) => {
            discordFormData.append(`files[${index}]`, file, file.name)
          })

          const response = await fetchWithTimeout(discordWebhookUrl!, {
            method: 'POST',
            body: discordFormData,
          })

          if (response.status === 413) {
            results.discord.error =
              'Discord rejected one or more files for exceeding its upload size limit.'
            break
          }

          if (!response.ok && response.status !== 204) {
            const body = await safeReadBody(response)
            results.discord.error =
              body || `Discord request failed with status ${response.status}.`
            break
          }
        }

        if (!results.discord.error) {
          results.discord.success = true
        }
      }
    } catch (error) {
      results.discord.error = toErrorMessage(error, 'Discord request failed.')
    }
  }

  const attemptedChannels = selectedChannels
  const successfulChannels = attemptedChannels.filter(
    (channel) => results[channel].success,
  )
  const attemptedLabel = formatChannelList(attemptedChannels)

  if (successfulChannels.length === attemptedChannels.length) {
    return NextResponse.json({
      success: true,
      message: `Delivered to ${attemptedLabel}.`,
      results,
    })
  }

  if (successfulChannels.length > 0) {
    return NextResponse.json(
      {
        success: true,
        message: 'Partially delivered.',
        results,
      },
      { status: 207 },
    )
  }

  return NextResponse.json(
    {
      success: false,
      message: `Delivery failed for ${attemptedLabel}.`,
      results,
    },
    { status: 500 },
  )
}
