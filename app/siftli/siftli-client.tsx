'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import cn from 'clsx'
import {
  ArrowPathIcon,
  Bars3Icon,
  CheckCircleIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

type Status = 'idle' | 'sending' | 'success' | 'error' | 'partial'
type UploadPhase = 'preparing' | 'uploading' | 'processing' | 'complete'
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

type UploadFileMeta = {
  id: string
  name: string
  size: number
}

type SubmissionSnapshot = {
  message: string
  files: File[]
  channel: ChannelMode
}

type SendResponseBody = {
  error?: string
  message?: string
  results?: DeliveryResults
}

const MAX_CHARS = 4000
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024
const MAX_VISIBLE_UPLOAD_PROGRESS_FILES = 4
const TEXTAREA_MIN_HEIGHT = 50
const TEXTAREA_MAX_HEIGHT = 420
const CHANNEL_KEYS: ChannelKey[] = ['telegram', 'discord']
const CHANNEL_OPTIONS: Array<{ value: ChannelMode; label: string }> = [
  { value: 'both', label: 'Both' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'discord', label: 'Discord' },
]

function fileSignature(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function phaseLabel(phase: UploadPhase) {
  if (phase === 'preparing') return 'Preparing'
  if (phase === 'uploading') return 'Uploading'
  if (phase === 'processing') return 'Processing'
  return 'Complete'
}

function modeFromFailedChannels(failedChannels: ChannelKey[]): ChannelMode {
  if (failedChannels.length === 2) return 'both'
  return failedChannels[0] ?? 'both'
}

function getChannelStateText(result: ChannelResult): string {
  if (result.skipped) return 'Not selected'
  return result.success ? 'Delivered' : 'Failed'
}

function createFallbackResults(mode: ChannelMode, error: string): DeliveryResults {
  const selectedChannels =
    mode === 'both' ? new Set<ChannelKey>(CHANNEL_KEYS) : new Set<ChannelKey>([mode])

  return {
    telegram: {
      success: false,
      error: selectedChannels.has('telegram') ? error : '',
      skipped: !selectedChannels.has('telegram'),
    },
    discord: {
      success: false,
      error: selectedChannels.has('discord') ? error : '',
      skipped: !selectedChannels.has('discord'),
    },
  }
}

function createSuccessResults(mode: ChannelMode): DeliveryResults {
  const selectedChannels =
    mode === 'both' ? new Set<ChannelKey>(CHANNEL_KEYS) : new Set<ChannelKey>([mode])

  return {
    telegram: {
      success: selectedChannels.has('telegram'),
      error: '',
      skipped: !selectedChannels.has('telegram'),
    },
    discord: {
      success: selectedChannels.has('discord'),
      error: '',
      skipped: !selectedChannels.has('discord'),
    },
  }
}

function parseResponseBody(rawBody: string): SendResponseBody {
  if (!rawBody) return {}
  try {
    return JSON.parse(rawBody) as SendResponseBody
  } catch {
    throw new Error('Server returned an invalid response.')
  }
}

function moveFileInArray(files: File[], fromIndex: number, toIndex: number): File[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= files.length ||
    toIndex >= files.length
  ) {
    return files
  }

  const next = [...files]
  const [moved] = next.splice(fromIndex, 1)
  if (!moved) return files
  next.splice(toIndex, 0, moved)
  return next
}

function hasFileTransfer(event: DragEvent<HTMLElement>): boolean {
  return Array.from(event.dataTransfer.types).includes('Files')
}

export default function SiftliClient() {
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [results, setResults] = useState<DeliveryResults | null>(null)
  const [progress, setProgress] = useState(0)
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('preparing')
  const [isDragging, setIsDragging] = useState(false)
  const [inputNotice, setInputNotice] = useState('')
  const [channelMode, setChannelMode] = useState<ChannelMode>('both')
  const [lastSubmission, setLastSubmission] = useState<SubmissionSnapshot | null>(
    null,
  )
  const [uploadFiles, setUploadFiles] = useState<UploadFileMeta[]>([])
  const [fileProgress, setFileProgress] = useState<Record<string, number>>({})
  const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dragDepthRef = useRef(0)

  const resizeTextarea = useCallback((element: HTMLTextAreaElement | null) => {
    if (!element) return
    element.style.height = `${TEXTAREA_MIN_HEIGHT}px`
    const nextHeight = Math.min(
      Math.max(element.scrollHeight, TEXTAREA_MIN_HEIGHT),
      TEXTAREA_MAX_HEIGHT,
    )
    element.style.height = `${nextHeight}px`
    element.style.overflowY = 'hidden'
  }, [])

  useEffect(() => {
    resizeTextarea(textareaRef.current)
  }, [message, resizeTextarea])

  const appendFiles = useCallback(
    (incomingFiles: File[]) => {
      if (incomingFiles.length === 0) return

      const nextFiles = [...files]
      const existing = new Set(nextFiles.map(fileSignature))
      let duplicateCount = 0
      let oversizedCount = 0

      for (const file of incomingFiles) {
        const signature = fileSignature(file)
        if (existing.has(signature)) {
          duplicateCount += 1
          continue
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
          oversizedCount += 1
          continue
        }
        existing.add(signature)
        nextFiles.push(file)
      }

      setFiles(nextFiles)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      if (duplicateCount > 0 || oversizedCount > 0) {
        const notices: string[] = []
        if (duplicateCount > 0) notices.push(`${duplicateCount} duplicate skipped`)
        if (oversizedCount > 0) notices.push(`${oversizedCount} over 50MB skipped`)
        setInputNotice(notices.join(' · '))
      } else {
        setInputNotice('')
      }
    },
    [files],
  )

  const addFilesFromInput = useCallback(
    (incoming: FileList | null) => {
      if (!incoming) return
      appendFiles(Array.from(incoming))
    },
    [appendFiles],
  )

  const onTextareaPaste = useCallback(
    (event: ClipboardEvent<HTMLTextAreaElement>) => {
      const pastedFiles = Array.from(event.clipboardData.items)
        .filter((item) => item.kind === 'file')
        .map((item) => item.getAsFile())
        .filter((file): file is File => file !== null)

      if (pastedFiles.length === 0) return
      event.preventDefault()
      appendFiles(pastedFiles)
    },
    [appendFiles],
  )

  const removeFile = useCallback((index: number) => {
    setFiles((previous) => previous.filter((_, current) => current !== index))
  }, [])

  const clearFiles = useCallback(() => {
    setFiles([])
    setDragSourceIndex(null)
    setDragOverIndex(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const clearResult = useCallback(() => {
    setStatus('idle')
    setStatusMessage('')
    setResults(null)
    setInputNotice('')
  }, [])

  const sendFormDataRequest = useCallback(
    (
      payload: FormData,
      onUploadProgress?: (ratio: number) => void,
    ): Promise<{ status: number; body: string }> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', '/api/siftli/send')
        // 0 disables browser-level timeout so large batches are not canceled.
        xhr.timeout = 0

        if (onUploadProgress) {
          xhr.upload.addEventListener('progress', (progressEvent) => {
            if (!progressEvent.lengthComputable || progressEvent.total <= 0) return
            onUploadProgress(progressEvent.loaded / progressEvent.total)
          })
        }

        xhr.addEventListener('load', () => {
          resolve({
            status: xhr.status,
            body: xhr.responseText || '',
          })
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Network error while uploading.'))
        })
        xhr.addEventListener('abort', () => {
          reject(new Error('Upload aborted.'))
        })

        xhr.send(payload)
      })
    },
    [],
  )

  const sendSubmission = useCallback(
    async (submission: SubmissionSnapshot, modeOverride?: ChannelMode) => {
      const trimmedMessage = submission.message.trim()
      if (!trimmedMessage && submission.files.length === 0) {
        setStatus('error')
        setStatusMessage('Type a message or attach at least one file.')
        return
      }

      const sendMode = modeOverride ?? submission.channel
      const snapshot: SubmissionSnapshot = {
        message: submission.message,
        files: [...submission.files],
        channel: submission.channel,
      }
      setLastSubmission(snapshot)

      setStatus('sending')
      setStatusMessage('Preparing upload queue...')
      setResults(null)
      setProgress(0)
      setUploadPhase('preparing')
      setInputNotice('')
      const requestUploadFiles = snapshot.files.map((file, index) => ({
        id: `${fileSignature(file)}-${index}`,
        name: file.name,
        size: file.size,
      }))
      const initialProgress = Object.fromEntries(
        requestUploadFiles.map((file) => [file.id, 0]),
      )
      setUploadFiles(requestUploadFiles)
      setFileProgress(initialProgress)

      type QueueItem = {
        file: File
        signature: string | null
        uploadMetaId: string | null
      }

      const queueItems: QueueItem[] = []
      let firstMessage = trimmedMessage

      if (trimmedMessage.length > MAX_CHARS) {
        const textBlob = new Blob([trimmedMessage], { type: 'text/plain' })
        const textFile = new File([textBlob], 'message.txt', {
          type: 'text/plain',
        })
        firstMessage = `[Message sent as file - ${trimmedMessage.length} chars]`
        queueItems.push({
          file: textFile,
          signature: null,
          uploadMetaId: null,
        })
      }

      snapshot.files.forEach((file, index) => {
        queueItems.push({
          file,
          signature: fileSignature(file),
          uploadMetaId: requestUploadFiles[index]?.id ?? null,
        })
      })

      const hasMessageOnlyRequest = queueItems.length === 0 && firstMessage.length > 0
      const totalSteps = queueItems.length > 0 ? queueItems.length : 1
      let completedSteps = 0
      let remainingFiles = [...snapshot.files]
      let remainingMessage = snapshot.message
      let lastResponseResults: DeliveryResults | null = null
      let lastResponseMessage = ''

      const updateOverallProgress = (ratio: number) => {
        const bounded = Math.max(0, Math.min(1, ratio))
        const computed = Math.round(((completedSteps + bounded) / totalSteps) * 90)
        setProgress(Math.max(1, Math.min(95, computed)))
      }

      try {
        setUploadPhase('uploading')
        setStatusMessage('Uploading...')

        if (hasMessageOnlyRequest) {
          const payload = new FormData()
          payload.append('channel', sendMode)
          payload.append('message', firstMessage)

          const uploadResult = await sendFormDataRequest(payload, updateOverallProgress)
          const body = parseResponseBody(uploadResult.body)
          lastResponseResults = body.results ?? null
          lastResponseMessage = body.message ?? body.error ?? ''

          if (
            uploadResult.status < 200 ||
            uploadResult.status >= 300 ||
            uploadResult.status === 207
          ) {
            const failureMessage = body.error ?? body.message ?? 'Delivery failed.'
            setStatus(uploadResult.status === 207 ? 'partial' : 'error')
            setStatusMessage(failureMessage)
            setResults(body.results ?? createFallbackResults(sendMode, failureMessage))
            setInputNotice('Only unsent files were kept for retry.')
            setLastSubmission({
              message: remainingMessage,
              files: [...remainingFiles],
              channel: snapshot.channel,
            })
            return
          }

          completedSteps += 1
          remainingMessage = ''
          setMessage('')
          resizeTextarea(textareaRef.current)
          setProgress(90)
        } else {
          for (let index = 0; index < queueItems.length; index += 1) {
            const current = queueItems[index]
            const includeMessage = index === 0 && firstMessage.length > 0

            setStatusMessage(`Uploading file ${index + 1} of ${queueItems.length}...`)

            const payload = new FormData()
            payload.append('channel', sendMode)
            if (includeMessage) {
              payload.append('message', firstMessage)
            }
            payload.append('files', current.file)

            if (current.uploadMetaId) {
              setFileProgress((previous) => ({
                ...previous,
                [current.uploadMetaId!]: Math.max(previous[current.uploadMetaId!] ?? 0, 1),
              }))
            }

            const uploadResult = await sendFormDataRequest(payload, (ratio) => {
              updateOverallProgress(ratio)
              if (!current.uploadMetaId) return
              const currentValue = Math.max(1, Math.min(100, Math.round(ratio * 100)))
              setFileProgress((previous) => ({
                ...previous,
                [current.uploadMetaId!]: Math.max(previous[current.uploadMetaId!] ?? 0, currentValue),
              }))
            })

            const body = parseResponseBody(uploadResult.body)
            if (body.results) {
              lastResponseResults = body.results
            }
            if (body.message || body.error) {
              lastResponseMessage = body.message ?? body.error ?? ''
            }

            const isSuccessful = uploadResult.status >= 200 && uploadResult.status < 300
            const isPartial = uploadResult.status === 207

            if (!isSuccessful || isPartial) {
              const failureMessage = body.error ?? body.message ?? 'Delivery failed.'
              setStatus(isPartial ? 'partial' : 'error')
              setStatusMessage(failureMessage)
              setResults(body.results ?? createFallbackResults(sendMode, failureMessage))
              setInputNotice('Only unsent files were kept for retry.')
              setFiles([...remainingFiles])
              setMessage(remainingMessage)
              resizeTextarea(textareaRef.current)
              setLastSubmission({
                message: remainingMessage,
                files: [...remainingFiles],
                channel: snapshot.channel,
              })
              return
            }

            completedSteps += 1
            setProgress(Math.max(1, Math.min(95, Math.round((completedSteps / totalSteps) * 90))))

            if (current.uploadMetaId) {
              setFileProgress((previous) => ({
                ...previous,
                [current.uploadMetaId!]: 100,
              }))
            }

            if (current.signature) {
              remainingFiles = remainingFiles.filter(
                (file) => fileSignature(file) !== current.signature,
              )
              setFiles([...remainingFiles])
            }

            if (includeMessage) {
              remainingMessage = ''
              setMessage('')
              resizeTextarea(textareaRef.current)
            }
          }
        }

        setUploadPhase('complete')
        setProgress(100)
        setStatus('success')
        setStatusMessage(lastResponseMessage || 'Delivered.')
        setResults(lastResponseResults ?? createSuccessResults(sendMode))
        setMessage('')
        setFiles([])
        setInputNotice('')
        resizeTextarea(textareaRef.current)
        setLastSubmission({
          message: '',
          files: [],
          channel: snapshot.channel,
        })
      } catch (error) {
        const failureMessage =
          error instanceof Error ? error.message : 'Unexpected error.'
        setStatus('error')
        setStatusMessage(failureMessage)
        setResults(
          lastResponseResults ?? createFallbackResults(sendMode, failureMessage),
        )
        setInputNotice('Only unsent files were kept for retry.')
        setFiles([...remainingFiles])
        setMessage(remainingMessage)
        resizeTextarea(textareaRef.current)
        setLastSubmission({
          message: remainingMessage,
          files: [...remainingFiles],
          channel: snapshot.channel,
        })
      } finally {
        setTimeout(() => {
          setProgress(0)
          setUploadFiles([])
          setFileProgress({})
        }, 700)
      }
    },
    [resizeTextarea, sendFormDataRequest],
  )

  const handleSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault()
      void sendSubmission({
        message,
        files: [...files],
        channel: channelMode,
      })
    },
    [channelMode, files, message, sendSubmission],
  )

  const canSubmit =
    status !== 'sending' && (message.trim().length > 0 || files.length > 0)
  const isOverLimit = message.length > MAX_CHARS
  const visibleUploadFiles = useMemo(
    () => uploadFiles.slice(0, MAX_VISIBLE_UPLOAD_PROGRESS_FILES),
    [uploadFiles],
  )
  const hiddenUploadFilesCount = uploadFiles.length - visibleUploadFiles.length
  const visibleSelectedFiles = files
  const totalSize = useMemo(
    () => files.reduce((sum, current) => sum + current.size, 0),
    [files],
  )
  const failedChannels = useMemo(() => {
    if (!results) return [] as ChannelKey[]
    return CHANNEL_KEYS.filter(
      (channel) => !results[channel].success && !results[channel].skipped,
    )
  }, [results])
  const canRetryFailed =
    status !== 'sending' && lastSubmission !== null && failedChannels.length > 0

  const retryFailedChannels = useCallback(() => {
    if (!lastSubmission || failedChannels.length === 0 || status === 'sending') return
    const retryMode = modeFromFailedChannels(failedChannels)
    void sendSubmission(lastSubmission, retryMode)
  }, [failedChannels, lastSubmission, sendSubmission, status])

  const onTextareaKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault()
        if (!canSubmit) return
        void sendSubmission({
          message,
          files: [...files],
          channel: channelMode,
        })
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        clearResult()
      }
    },
    [canSubmit, channelMode, clearResult, files, message, sendSubmission],
  )

  const reorderFile = useCallback((fromIndex: number, toIndex: number) => {
    setFiles((previous) => moveFileInArray(previous, fromIndex, toIndex))
  }, [])

  const onFileDragStart = useCallback(
    (index: number, event: DragEvent<HTMLLIElement>) => {
      setDragSourceIndex(index)
      setDragOverIndex(index)
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', String(index))
    },
    [],
  )

  const onFileDragOver = useCallback(
    (index: number, event: DragEvent<HTMLLIElement>) => {
      event.preventDefault()
      event.stopPropagation()
      event.dataTransfer.dropEffect = 'move'
      setDragOverIndex(index)
    },
    [],
  )

  const onFileDrop = useCallback(
    (index: number, event: DragEvent<HTMLLIElement>) => {
      event.preventDefault()
      event.stopPropagation()

      const fallbackIndex = Number.parseInt(event.dataTransfer.getData('text/plain'), 10)
      const sourceIndex = dragSourceIndex ?? (Number.isNaN(fallbackIndex) ? null : fallbackIndex)
      if (sourceIndex !== null) {
        reorderFile(sourceIndex, index)
      }

      setDragSourceIndex(null)
      setDragOverIndex(null)
    },
    [dragSourceIndex, reorderFile],
  )

  const onFileDragEnd = useCallback(() => {
    setDragSourceIndex(null)
    setDragOverIndex(null)
  }, [])

  return (
    <section className='relative min-h-[68vh] pb-48 sm:pb-52'>
      <h1 className='font-semibold mb-7 text-rurikon-600 text-balance'>SIFTLI</h1>

      <p className='text-rurikon-500'>
        Send one message to Telegram and Discord with optional file uploads.
      </p>

      <p className='mt-2 text-rurikon-300 text-sm'>
        Paste files directly in the input, use shortcuts, and retry only failed
        channels.
      </p>

      <div className='mt-7 space-y-3'>
        {status !== 'idle' ? (
          <div
            className={cn(
              'border rounded-xs px-3 py-2 text-sm flex items-start gap-2',
              status === 'sending' && 'border-rurikon-border text-rurikon-500',
              status === 'success' && 'border-emerald-300 text-emerald-700',
              status === 'partial' && 'border-amber-300 text-amber-700',
              status === 'error' && 'border-red-300 text-red-700',
            )}
          >
            <span className='mt-px shrink-0'>
              {status === 'sending' ? (
                <ArrowPathIcon className='h-4 w-4 animate-spin' />
              ) : null}
              {status === 'success' ? <CheckCircleIcon className='h-4 w-4' /> : null}
              {status === 'partial' ? <ExclamationTriangleIcon className='h-4 w-4' /> : null}
              {status === 'error' ? <ExclamationTriangleIcon className='h-4 w-4' /> : null}
            </span>
            <div className='min-w-0 flex-1'>
              <p>{statusMessage}</p>
            </div>
            <div className='flex items-center gap-2'>
              {canRetryFailed ? (
                <button
                  type='button'
                  onClick={retryFailedChannels}
                  className='text-xs text-rurikon-500 hover:text-rurikon-700 underline underline-offset-2'
                >
                  retry failed
                </button>
              ) : null}
              {status !== 'sending' ? (
                <button
                  type='button'
                  onClick={clearResult}
                  className='text-xs text-rurikon-300 hover:text-rurikon-600 underline underline-offset-2'
                >
                  dismiss
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {results ? (
          <div className='grid gap-2 sm:grid-cols-2'>
            <div className='border border-rurikon-border rounded-xs p-3 text-sm'>
              <p className='font-medium text-rurikon-600'>Telegram</p>
              <p
                className={cn(
                  'mt-1',
                  results.telegram.skipped && 'text-rurikon-300',
                  !results.telegram.skipped &&
                    (results.telegram.success ? 'text-emerald-700' : 'text-red-700'),
                )}
              >
                {getChannelStateText(results.telegram)}
              </p>
              {!results.telegram.success &&
              !results.telegram.skipped &&
              results.telegram.error ? (
                <p className='mt-1 text-xs text-rurikon-300'>
                  {results.telegram.error}
                </p>
              ) : null}
            </div>
            <div className='border border-rurikon-border rounded-xs p-3 text-sm'>
              <p className='font-medium text-rurikon-600'>Discord</p>
              <p
                className={cn(
                  'mt-1',
                  results.discord.skipped && 'text-rurikon-300',
                  !results.discord.skipped &&
                    (results.discord.success ? 'text-emerald-700' : 'text-red-700'),
                )}
              >
                {getChannelStateText(results.discord)}
              </p>
              {!results.discord.success &&
              !results.discord.skipped &&
              results.discord.error ? (
                <p className='mt-1 text-xs text-rurikon-300'>
                  {results.discord.error}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className='mt-6 space-y-2'>
        {status === 'sending' && uploadFiles.length > 0 ? (
          <div className='rounded-2xl border border-rurikon-border bg-[var(--surface-raised)] px-3 py-2 shadow-[var(--overlay-shadow)] max-h-[28vh] overflow-x-hidden overflow-y-auto'>
            <ul className='mt-0 list-none pl-0 flex flex-col gap-2'>
              {visibleUploadFiles.map((file) => {
                const progressValue = fileProgress[file.id] ?? 0
                return (
                  <li
                    key={file.id}
                    className='border border-rurikon-border rounded-xl px-2 py-1.5 bg-rurikon-50/80 min-w-0'
                  >
                    <div className='flex min-w-0 items-center gap-2 text-xs text-rurikon-500'>
                      <DocumentTextIcon className='h-4 w-4 text-rurikon-300 shrink-0' />
                      <span className='flex-1 min-w-0 truncate'>{file.name}</span>
                      <span className='ml-auto shrink-0 text-rurikon-300'>
                        {progressValue}%
                      </span>
                    </div>
                    <div className='mt-1 h-1 w-full rounded-full bg-rurikon-100 overflow-hidden'>
                      <div
                        className='h-full bg-rurikon-400 transition-[width] duration-200'
                        style={{ width: `${progressValue}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
            {hiddenUploadFilesCount > 0 ? (
              <p className='mt-2 text-xs text-rurikon-300'>
                +{hiddenUploadFilesCount} more files uploading
              </p>
            ) : null}
          </div>
        ) : null}

        {status !== 'sending' && files.length > 0 ? (
          <div className='rounded-2xl border border-rurikon-border bg-[var(--surface-raised)] px-3 py-2 shadow-[var(--overlay-shadow)] max-h-[28vh] overflow-x-hidden overflow-y-auto'>
            <ul className='mt-0 list-none pl-0 grid grid-cols-1 gap-2 sm:grid-cols-2'>
              {visibleSelectedFiles.map((file, index) => (
                <li
                  key={fileSignature(file)}
                  draggable
                  onDragStart={(event) => onFileDragStart(index, event)}
                  onDragOver={(event) => onFileDragOver(index, event)}
                  onDrop={(event) => onFileDrop(index, event)}
                  onDragEnd={onFileDragEnd}
                  className={cn(
                    'border border-rurikon-border rounded-xl px-2 py-1 flex min-w-0 items-center gap-2 text-xs text-rurikon-500 bg-rurikon-50/80 cursor-move',
                    dragSourceIndex === index && 'opacity-55',
                    dragOverIndex === index &&
                      dragSourceIndex !== index &&
                      'border-rurikon-400 bg-rurikon-100/70',
                  )}
                >
                  <Bars3Icon className='h-4 w-4 text-rurikon-300 shrink-0' />
                  <DocumentTextIcon className='h-4 w-4 text-rurikon-300 shrink-0' />
                  <span className='flex-1 min-w-0 truncate'>{file.name}</span>
                  <span className='shrink-0 text-rurikon-300'>{formatSize(file.size)}</span>
                  <button
                    type='button'
                    onClick={() => removeFile(index)}
                    className='shrink-0 p-0.5 text-rurikon-300 hover:text-rurikon-700'
                    aria-label={`Remove ${file.name}`}
                    draggable={false}
                  >
                    <XMarkIcon className='h-4 w-4' />
                  </button>
                </li>
              ))}
            </ul>
            <p className='mt-2 text-xs text-rurikon-300'>Drag files to reorder queue.</p>
            <p className='mt-2 text-xs text-rurikon-300'>
              {files.length} file{files.length > 1 ? 's' : ''} · {formatSize(totalSize)}
            </p>
            <div className='mt-2'>
              <button
                type='button'
                onClick={clearFiles}
                className='text-xs text-rurikon-400 hover:text-rurikon-700 underline underline-offset-2'
              >
                remove all
              </button>
            </div>
          </div>
        ) : null}

        {status === 'sending' && progress > 0 ? (
          <div className='rounded-xl border border-rurikon-border bg-[var(--surface-raised)] px-3 py-2'>
            <div className='h-1.5 w-full rounded-full bg-rurikon-100 overflow-hidden'>
              <div
                className='h-full bg-rurikon-400 transition-[width] duration-300'
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className='mt-1 text-xs text-rurikon-300'>
              {phaseLabel(uploadPhase)} · {progress}%
            </p>
          </div>
        ) : null}
      </div>

      <div className='fixed left-1/2 bottom-3 z-20 w-[min(820px,calc(100vw-1rem))] -translate-x-1/2'>
        <form
          onSubmit={handleSubmit}
          onDragEnter={(event) => {
            if (!hasFileTransfer(event)) return
            event.preventDefault()
            dragDepthRef.current += 1
            setIsDragging(true)
          }}
          onDragOver={(event) => {
            if (!hasFileTransfer(event)) return
            event.preventDefault()
            event.dataTransfer.dropEffect = 'copy'
            setIsDragging(true)
          }}
          onDragLeave={() => {
            dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
            if (dragDepthRef.current === 0) {
              setIsDragging(false)
            }
          }}
          onDrop={(event) => {
            if (!hasFileTransfer(event)) return
            event.preventDefault()
            dragDepthRef.current = 0
            setIsDragging(false)
            addFilesFromInput(event.dataTransfer.files)
          }}
          className={cn(
            'w-full space-y-2 px-1 py-1 sm:px-2',
            'pb-[max(env(safe-area-inset-bottom),0.75rem)]',
            'bg-[var(--background)]',
            isDragging && 'rounded-xl outline outline-1 outline-rurikon-400',
          )}
        >
          <input
            ref={fileInputRef}
            type='file'
            multiple
            className='hidden'
            onChange={(event) => addFilesFromInput(event.target.files)}
          />

          <div>
            <div className='mb-2 flex items-center justify-between gap-2'>
              <span className='text-xs text-rurikon-300'>Channel</span>
              <div className='inline-flex border border-rurikon-border rounded-xl overflow-hidden'>
                {CHANNEL_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type='button'
                    disabled={status === 'sending'}
                    onClick={() => setChannelMode(option.value)}
                    className={cn(
                      'px-2.5 py-1 text-xs transition-colors',
                      channelMode === option.value
                        ? 'bg-[var(--accent-solid)] text-[var(--accent-solid-text)]'
                        : 'bg-[var(--background)] text-rurikon-400 hover:text-rurikon-700',
                      status === 'sending' && 'opacity-60 cursor-not-allowed',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className='flex items-end gap-2'>
              <button
                type='button'
                onClick={() => fileInputRef.current?.click()}
                className='h-[50px] px-4 border border-rurikon-border rounded-xl text-rurikon-400 hover:text-rurikon-700 hover:border-rurikon-400 transition-colors inline-flex items-center gap-2 shrink-0 bg-[var(--background)]'
                aria-label='Attach files'
                disabled={status === 'sending'}
              >
                <PaperClipIcon className='h-4 w-4' />
                <span className='hidden sm:inline'>Attach</span>
              </button>

              <div className='relative min-w-0 flex-1'>
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={message}
                  onChange={(event) => {
                    setMessage(event.target.value)
                    resizeTextarea(event.target)
                  }}
                  onPaste={onTextareaPaste}
                  onKeyDown={onTextareaKeyDown}
                  placeholder='Type your message...'
                  className={cn(
                    'w-full min-h-[50px] resize-none overflow-hidden border rounded-xl px-4 py-3 pr-16',
                    'bg-[var(--background)] text-rurikon-500 placeholder:text-rurikon-300',
                    'focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-dotted',
                    isOverLimit ? 'border-amber-400' : 'border-rurikon-border',
                  )}
                  disabled={status === 'sending'}
                />
                <span
                  className={cn(
                    'absolute bottom-1.5 right-2 text-[11px]',
                    isOverLimit ? 'text-amber-600' : 'text-rurikon-300',
                  )}
                >
                  {message.length.toLocaleString()}
                </span>
              </div>

              <button
                type='submit'
                disabled={!canSubmit}
                className={cn(
                  'h-[50px] w-[50px] border rounded-full transition-colors shrink-0 inline-flex items-center justify-center',
                  canSubmit
                    ? 'border-black bg-black text-white hover:bg-neutral-800'
                    : 'border-rurikon-border bg-rurikon-100 text-rurikon-300 cursor-not-allowed',
                )}
                aria-label='Send'
              >
                {status === 'sending' ? (
                  <ArrowPathIcon className='h-5 w-5 animate-spin' />
                ) : (
                  <PaperAirplaneIcon className='h-5 w-5' />
                )}
              </button>
            </div>
          </div>

          <p className='text-center text-xs text-rurikon-300 px-2'>
            Attach multiple files up to 50MB each. Paste files into the input.
            Use Ctrl/Cmd+Enter to send.
          </p>
          {inputNotice ? (
            <p className='text-center text-xs text-amber-600'>{inputNotice}</p>
          ) : null}
        </form>
      </div>
    </section>
  )
}
