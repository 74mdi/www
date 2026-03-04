import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const message = formData.get('message') as string
    const files = formData.getAll('files') as File[]

    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN
    const telegramChatId = process.env.TELEGRAM_CHAT_ID
    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL

    if (!telegramBotToken || !telegramChatId || !discordWebhookUrl) {
      return NextResponse.json(
        { error: 'Missing configuration. Please set up Telegram and Discord credentials.' },
        { status: 500 }
      )
    }

    const results = {
      telegram: { success: false, error: '' },
      discord: { success: false, error: '' }
    }

    // Send to Telegram
    try {
      // Send message first if exists
      if (message) {
        const telegramResponse = await fetch(
          `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: telegramChatId,
              text: message,
              parse_mode: 'HTML',
            }),
          }
        )
        const telegramResult = await telegramResponse.json()
        if (!telegramResult.ok) {
          results.telegram.error = telegramResult.description || 'Failed to send message'
        }
      }

      // Send each file
      for (const file of files) {
        const telegramFormData = new FormData()
        telegramFormData.append('chat_id', telegramChatId)
        telegramFormData.append('document', file, file.name)

        const telegramResponse = await fetch(
          `https://api.telegram.org/bot${telegramBotToken}/sendDocument`,
          {
            method: 'POST',
            body: telegramFormData,
          }
        )

        const telegramResult = await telegramResponse.json()
        if (!telegramResult.ok) {
          results.telegram.error = telegramResult.description || 'Failed to send file to Telegram'
        }
      }

      // If no errors occurred, mark as success
      if (!results.telegram.error) {
        results.telegram.success = true
      }
    } catch (error) {
      results.telegram.error = error instanceof Error ? error.message : 'Telegram error'
    }

    // Send to Discord
    try {
      // Discord supports up to 10 files per message
      const chunkSize = 10
      for (let i = 0; i < Math.max(1, files.length); i += chunkSize) {
        const discordFormData = new FormData()
        
        // Only include message in first chunk
        if (i === 0 && message) {
          discordFormData.append('payload_json', JSON.stringify({ content: message }))
        } else if (i > 0) {
          discordFormData.append('payload_json', JSON.stringify({}))
        }
        
        // Add files for this chunk
        const fileChunk = files.slice(i, i + chunkSize)
        fileChunk.forEach((file, index) => {
          discordFormData.append(`files[${index}]`, file, file.name)
        })

        // Only send if we have files or message
        if (fileChunk.length > 0 || (i === 0 && message)) {
          const discordResponse = await fetch(discordWebhookUrl, {
            method: 'POST',
            body: discordFormData,
          })

          if (!discordResponse.ok && discordResponse.status !== 204) {
            const errorText = await discordResponse.text()
            results.discord.error = errorText || 'Failed to send to Discord'
          }
        }
      }

      // If no errors occurred, mark as success
      if (!results.discord.error) {
        results.discord.success = true
      }
    } catch (error) {
      results.discord.error = error instanceof Error ? error.message : 'Discord error'
    }

    const allSuccess = results.telegram.success && results.discord.success
    const partialSuccess = results.telegram.success || results.discord.success

    if (allSuccess) {
      return NextResponse.json({ 
        success: true, 
        message: 'Message delivered to both Telegram and Discord',
        results 
      })
    } else if (partialSuccess) {
      return NextResponse.json({ 
        success: true, 
        message: 'Message partially delivered',
        results 
      }, { status: 207 })
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to deliver message',
        results 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
