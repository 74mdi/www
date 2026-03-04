"use client"

import React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Upload, Send, X, CheckCircle, AlertCircle, Loader2, Moon, Sun, FileText, MessageSquare } from "lucide-react"

type Status = "idle" | "sending" | "success" | "error" | "partial"
interface Results { telegram: { success: boolean; error: string }; discord: { success: boolean; error: string } }

const MAX_CHARS = 4000 // Telegram limit is 4096, Discord is 2000 - using 4000 as safe limit

export default function MessageSender() {
  const [message, setMessage] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState<Status>("idle")
  const [statusMessage, setStatusMessage] = useState("")
  const [results, setResults] = useState<Results | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadPhase, setUploadPhase] = useState<"preparing" | "uploading" | "processing" | "complete">("preparing")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const dark = saved === "dark" || (!saved && prefersDark)
    setIsDark(dark)
    document.documentElement.classList.toggle("dark", dark)
  }, [])

  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const next = !prev
      document.documentElement.classList.toggle("dark", next)
      localStorage.setItem("theme", next ? "dark" : "light")
      return next
    })
  }, [])

  const addFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size))
      const toAdd = Array.from(newFiles).filter(f => !existing.has(f.name + f.size))
      return [...prev, ...toAdd]
    })
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() && files.length === 0) {
      setStatus("error")
      setStatusMessage("Please enter a message or attach files")
      return
    }

    setStatus("sending")
    setStatusMessage("Preparing...")
    setResults(null)
    setProgress(0)
    setUploadPhase("preparing")

    try {
      const formData = new FormData()
      
      // If message exceeds limit, convert to file
      const trimmedMessage = message.trim()
      if (trimmedMessage.length > MAX_CHARS) {
        const textBlob = new Blob([trimmedMessage], { type: "text/plain" })
        const textFile = new File([textBlob], "message.txt", { type: "text/plain" })
        formData.append("files", textFile)
        formData.append("message", `[Message sent as file - ${trimmedMessage.length} characters]`)
      } else if (trimmedMessage) {
        formData.append("message", trimmedMessage)
      }

      // Append all files
      files.forEach(file => {
        formData.append("files", file)
      })

      // Calculate total size for progress
      const totalSize = files.reduce((sum, f) => sum + f.size, 0) + (trimmedMessage.length > MAX_CHARS ? trimmedMessage.length : 0)

      // Use XMLHttpRequest for real upload progress
      setUploadPhase("uploading")
      setStatusMessage("Uploading...")
      
      const uploadResult = await new Promise<{ status: number; data: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 70) // 0-70% for upload
            setProgress(percent)
          }
        })
        
        xhr.addEventListener("load", () => {
          setUploadPhase("processing")
          setStatusMessage("Processing...")
          setProgress(90)
          resolve({ status: xhr.status, data: xhr.responseText })
        })
        
        xhr.addEventListener("error", () => {
          reject(new Error("Network error - please check your connection"))
        })
        
        xhr.addEventListener("abort", () => {
          reject(new Error("Upload cancelled"))
        })
        
        xhr.open("POST", "/api/send")
        xhr.send(formData)
      })

      setUploadPhase("complete")
      setProgress(100)
      
      // Parse response
      let data
      try {
        data = JSON.parse(uploadResult.data)
      } catch {
        throw new Error("Invalid response from server")
      }

      if (uploadResult.status >= 200 && uploadResult.status < 300) {
        setStatus("success")
        setStatusMessage("Delivered")
        setResults(data.results)
        setMessage("")
        setFiles([])
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = '50px'
        }
      } else if (uploadResult.status === 207) {
        setStatus("partial")
        setStatusMessage("Partially delivered")
        setResults(data.results)
        setMessage("")
        setFiles([])
        if (textareaRef.current) {
          textareaRef.current.style.height = '50px'
        }
      } else {
        setStatus("error")
        setStatusMessage(data.error || "Failed to send")
        if (data.results) setResults(data.results)
      }

    } catch (err) {
      setStatus("error")
      setStatusMessage(err instanceof Error ? err.message : "Connection error")
    } finally {
      setTimeout(() => setProgress(0), 500)
    }
  }

  const formatSize = (bytes: number) => 
    bytes < 1024 ? `${bytes} B` : 
    bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : 
    `${(bytes / 1048576).toFixed(1)} MB`

  const totalFilesSize = files.reduce((sum, f) => sum + f.size, 0)
  const charCount = message.length
  const isOverLimit = charCount > MAX_CHARS

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Blur background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -left-40 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 right-1/4 w-[450px] h-[450px] bg-primary/10 rounded-full blur-[120px]" />
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 p-3 rounded-full backdrop-blur-2xl bg-card/40 border border-border/30 shadow-xl hover:bg-card/60 transition-all hover:scale-105 active:scale-95"
        aria-label={isDark ? "Light mode" : "Dark mode"}
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Hero section - top */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 pt-16 pb-8">
        <div className="text-center max-w-lg">
          <div className="inline-flex p-4 rounded-3xl bg-primary/10 backdrop-blur-xl border border-primary/20 mb-6">
            <MessageSquare className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 text-balance">
            Send Anywhere
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground text-pretty">
            Instantly deliver messages and files to your Telegram and Discord channels
          </p>
        </div>
      </section>

      {/* Status toast */}
      {status !== "idle" && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`flex items-center gap-3 px-5 py-3 rounded-full backdrop-blur-2xl border shadow-2xl ${
            status === "sending" ? "bg-card/80 border-border/50" :
            status === "success" ? "bg-emerald-500/20 border-emerald-500/40" :
            status === "partial" ? "bg-amber-500/20 border-amber-500/40" :
            "bg-red-500/20 border-red-500/40"
          }`}>
            {status === "sending" && <Loader2 className="w-4 h-4 animate-spin" />}
            {status === "success" && <CheckCircle className="w-4 h-4 text-emerald-500" />}
            {status === "partial" && <AlertCircle className="w-4 h-4 text-amber-500" />}
            {status === "error" && <AlertCircle className="w-4 h-4 text-red-500" />}
            <span className="text-sm font-medium">{statusMessage}</span>
            {results && (
              <div className="flex items-center gap-2 pl-2 border-l border-current/20">
                <span className="text-xs opacity-70">
                  {results.telegram.success ? "TG" : ""}{results.telegram.success && results.discord.success ? " " : ""}{results.discord.success ? "DC" : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form section - bottom */}
      <section className="sticky bottom-0 border-t border-border/30 backdrop-blur-2xl bg-background/60">
        {/* Modern Progress bar */}
        {status === "sending" && progress > 0 && (
          <div className="relative h-1.5 bg-muted/20 overflow-hidden">
            {/* Animated background shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer" />
            {/* Main progress bar */}
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary to-primary/80 transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            >
              {/* Glowing edge */}
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/30 blur-sm" />
            </div>
            {/* Progress percentage indicator */}
            <div 
              className="absolute top-full mt-1 text-[10px] font-medium text-primary/70 transition-[left] duration-300 ease-out"
              style={{ left: `${Math.max(progress - 2, 0)}%` }}
            >
              {Math.round(progress)}%
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto p-4 md:p-6">
          {/* Files preview */}
          {files.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {files.map((file, index) => (
                <div 
                  key={`${file.name}-${file.size}`}
                  className="flex items-center gap-2 px-3 py-2 bg-card/60 backdrop-blur-xl border border-border/40 rounded-xl text-sm"
                >
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-medium truncate max-w-[100px]">{file.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{formatSize(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="p-0.5 hover:bg-destructive/20 rounded transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              ))}
              {files.length > 1 && (
                <div className="flex items-center px-3 py-2 text-xs text-muted-foreground">
                  {files.length} files ({formatSize(totalFilesSize)})
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            {/* File attachment */}
            <div className="relative shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => addFiles(e.target.files)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files) }}
                className={`flex items-center justify-center gap-2 px-3 md:px-4 py-3 bg-card/60 backdrop-blur-xl border rounded-2xl transition-all hover:bg-card/80 min-w-[48px] h-[50px] ${
                  isDragging ? "border-primary bg-primary/10" : "border-border/40"
                }`}
                aria-label={files.length > 0 ? "Add more files" : "Attach files"}
              >
                <Upload className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground hidden md:inline">
                  {files.length > 0 ? `Add more` : "Attach"}
                </span>
              </button>
            </div>

            {/* Message input */}
            <div className="flex-1 relative min-w-0">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value)
                  // Auto-expand on change
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = '50px'
                  target.style.height = Math.min(target.scrollHeight, 200) + 'px'
                }}
                placeholder="Type your message..."
                rows={1}
                className={`w-full px-5 py-3 pr-16 bg-card/60 backdrop-blur-xl border rounded-2xl placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors min-h-[50px] max-h-[200px] overflow-y-auto ${
                  isOverLimit ? "border-amber-500/50 focus:border-amber-500" : "border-border/40 focus:border-primary/50"
                }`}
              />
              {/* Character count */}
              <div className={`absolute bottom-2 right-3 text-xs pointer-events-none ${
                isOverLimit ? "text-amber-500" : "text-muted-foreground/50"
              }`}>
                {charCount > 0 && (
                  <>
                    {charCount.toLocaleString()}
                    {isOverLimit && <span className="ml-1 hidden sm:inline">(will send as file)</span>}
                  </>
                )}
              </div>
            </div>

            {/* Send button */}
            <button
              type="submit"
              disabled={status === "sending"}
              className="flex items-center justify-center gap-2 px-4 md:px-6 py-3 bg-primary text-primary-foreground font-medium rounded-2xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/25 active:scale-95 shrink-0 min-w-[48px] h-[50px]"
            >
              {status === "sending" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              <span className="hidden md:inline">Send</span>
            </button>
          </div>

          {/* Quick hint */}
          <p className="text-xs text-muted-foreground/50 text-center mt-3">
            Attach multiple files up to 50MB each. Messages over {MAX_CHARS.toLocaleString()} characters will be sent as a file.
          </p>
        </form>
      </section>
    </div>
  )
}
