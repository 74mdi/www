'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { siDiscord, siGithub, siGoogle, type SimpleIcon } from 'simple-icons'

import { getSupabaseBrowserClient } from '@/app/_lib/supabase-browser'

type OAuthProvider = 'discord' | 'github' | 'google'
type IconProps = { className?: string; style?: React.CSSProperties }

type GuestbookEntry = {
  id: number
  display_name: string
  avatar_url: string | null
  provider: string | null
  message: string
  created_at: string
}

const OAUTH_PROVIDERS: Array<{ id: OAuthProvider; label: string }> = [
  { id: 'discord', label: 'Discord' },
  { id: 'github', label: 'GitHub' },
  { id: 'google', label: 'Google' },
]

const BUTTON_CLASS =
  'inline-flex items-center justify-center rounded-md border border-[var(--color-rurikon-border)] px-3 py-1.5 text-rurikon-600 transition-colors hover:border-[var(--color-rurikon-border-strong)] hover:text-rurikon-800 focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:rounded-md focus-visible:outline-offset-2 focus-visible:outline-dotted disabled:opacity-60 disabled:hover:border-[var(--color-rurikon-border)] disabled:hover:text-rurikon-600'

const INPUT_CLASS =
  'w-full rounded-md border border-[var(--color-rurikon-border)] bg-[var(--background)] px-3 py-2 text-rurikon-600 placeholder:text-rurikon-300 focus-visible:outline focus-visible:outline-rurikon-400 focus-visible:outline-offset-2 focus-visible:outline-dotted'

const ENTRY_LIMIT = 280
const PROVIDER_ICONS: Record<OAuthProvider, SimpleIcon> = {
  discord: siDiscord,
  github: siGithub,
  google: siGoogle,
}

function UnknownProviderIcon({ className, style }: IconProps) {
  return (
    <svg
      viewBox='0 0 24 24'
      aria-hidden='true'
      className={className}
      fill='currentColor'
      style={style}
    >
      <path d='M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 15.2a1.15 1.15 0 1 1 1.15-1.15A1.16 1.16 0 0 1 12 17.2Zm1.25-4.58v.38h-2.1V12.4c0-1.03.32-1.56 1.13-2.1.74-.49 1.05-.78 1.05-1.38a1.34 1.34 0 0 0-1.43-1.3 1.44 1.44 0 0 0-1.47 1.4H8.3a3.54 3.54 0 0 1 3.68-3.3 3.4 3.4 0 0 1 3.56 3.17c0 1.41-.72 2.15-1.73 2.8-.4.27-.56.45-.56.93Z' />
    </svg>
  )
}

function normalizeName(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, 40)
}

function pickString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function formatError(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }

  return 'Something failed. Please try again.'
}

function hasMissingTableError(error: unknown, tableName: string): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }

  const code =
    'code' in error && typeof error.code === 'string' ? error.code : null
  const message =
    'message' in error && typeof error.message === 'string'
      ? error.message
      : null

  return (
    code === 'PGRST205' ||
    message?.includes(`'public.${tableName}'`) === true ||
    message?.includes(`public.${tableName}`) === true
  )
}

function getAvatarUrl(user: User): string | null {
  return (
    pickString(user.user_metadata?.avatar_url) ??
    pickString(user.user_metadata?.picture) ??
    null
  )
}

function titleCase(value: string | null): string {
  if (!value) return 'Unknown'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function normalizeProvider(value: string | null): OAuthProvider | null {
  if (!value) return null
  if (value === 'discord' || value === 'github' || value === 'google') {
    return value
  }
  return null
}

function providerLabel(value: string | null): string {
  const normalized = normalizeProvider(value)
  if (normalized === 'github') return 'GitHub'
  if (normalized === 'discord') return 'Discord'
  if (normalized === 'google') return 'Google'
  return titleCase(value)
}

function ProviderIcon({
  provider,
  className,
}: {
  provider: string | null
  className?: string
}) {
  const normalized = normalizeProvider(provider)

  if (!normalized) {
    return <UnknownProviderIcon className={className} />
  }

  const icon = PROVIDER_ICONS[normalized]

  return (
    <svg
      viewBox='0 0 24 24'
      aria-hidden='true'
      className={className}
      fill='currentColor'
    >
      <path d={icon.path} />
    </svg>
  )
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function suggestedNames(user: User, currentName: string): string[] {
  const localEmailName = user.email?.split('@')[0] ?? ''
  const candidates = [
    currentName,
    pickString(user.user_metadata?.full_name) ?? '',
    pickString(user.user_metadata?.name) ?? '',
    pickString(user.user_metadata?.preferred_username) ?? '',
    localEmailName,
  ]

  return Array.from(
    new Set(
      candidates
        .map((candidate) => normalizeName(candidate))
        .filter((candidate) => candidate.length >= 2),
    ),
  )
}

export default function GuestbookClient() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), [])

  const [session, setSession] = useState<Session | null>(null)
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [entriesTableAvailable, setEntriesTableAvailable] = useState(true)
  const [profilesTableAvailable, setProfilesTableAvailable] = useState(true)
  const [savedName, setSavedName] = useState('')
  const [nameDraft, setNameDraft] = useState('')
  const [messageDraft, setMessageDraft] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthBusy, setIsAuthBusy] = useState(false)
  const [isSavingName, setIsSavingName] = useState(false)
  const [isPosting, setIsPosting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const loadEntries = useCallback(async () => {
    if (!supabase) return

    const { data, error } = await supabase
      .from('guestbook_entries')
      .select('id, display_name, avatar_url, provider, message, created_at')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      if (hasMissingTableError(error, 'guestbook_entries')) {
        setEntriesTableAvailable(false)
        setEntries([])
        return
      }
      throw error
    }

    setEntriesTableAvailable(true)
    setEntries((data ?? []) as GuestbookEntry[])
  }, [supabase])

  const loadProfileName = useCallback(
    async (userId: string) => {
      if (!supabase) return

      const { data, error } = await supabase
        .from('guestbook_profiles')
        .select('display_name')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        if (hasMissingTableError(error, 'guestbook_profiles')) {
          setProfilesTableAvailable(false)

          const fallbackName =
            typeof window !== 'undefined'
              ? normalizeName(
                  window.localStorage.getItem(`guestbook-name:${userId}`) ?? '',
                )
              : ''

          setSavedName(fallbackName)
          setNameDraft(fallbackName)
          return
        }
        throw error
      }

      setProfilesTableAvailable(true)
      const nextName = normalizeName(data?.display_name ?? '')
      setSavedName(nextName)
      setNameDraft(nextName)
    },
    [supabase],
  )

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false)
      return
    }

    let isMounted = true

    const bootstrap = async () => {
      try {
        const [{ data: sessionData }] = await Promise.all([
          supabase.auth.getSession(),
          loadEntries(),
        ])

        if (!isMounted) return

        const nextSession = sessionData.session
        setSession(nextSession)

        if (nextSession?.user) {
          await loadProfileName(nextSession.user.id)
        }
      } catch (error) {
        if (!isMounted) return
        setErrorMessage(formatError(error))
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void bootstrap()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setNotice(null)
      setErrorMessage(null)

      if (nextSession?.user) {
        void loadProfileName(nextSession.user.id).catch((error) => {
          setErrorMessage(formatError(error))
        })
      } else {
        setSavedName('')
        setNameDraft('')
      }

      void loadEntries().catch((error) => {
        setErrorMessage(formatError(error))
      })
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase, loadEntries, loadProfileName])

  const currentUser = session?.user ?? null
  const currentAvatar = currentUser ? getAvatarUrl(currentUser) : null
  const currentProviderRaw = pickString(currentUser?.app_metadata?.provider) ?? null
  const currentProvider = providerLabel(currentProviderRaw)

  const nameOptions = useMemo(() => {
    if (!currentUser) return []
    return suggestedNames(currentUser, savedName)
  }, [currentUser, savedName])

  const canPost = Boolean(currentUser && savedName.length >= 2)
  const trimmedMessageLength = messageDraft.trim().length

  const handleSignIn = async (provider: OAuthProvider) => {
    if (!supabase) return

    setErrorMessage(null)
    setNotice(null)
    setIsAuthBusy(true)

    const redirectTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/guestbook`
        : undefined

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: redirectTo ? { redirectTo } : undefined,
    })

    if (error) {
      setErrorMessage(formatError(error))
      setIsAuthBusy(false)
    }
  }

  const handleSignOut = async () => {
    if (!supabase) return

    setErrorMessage(null)
    setNotice(null)
    setIsAuthBusy(true)

    const { error } = await supabase.auth.signOut()

    if (error) {
      setErrorMessage(formatError(error))
    } else {
      setSavedName('')
      setNameDraft('')
      setMessageDraft('')
      setNotice('Signed out.')
    }

    setIsAuthBusy(false)
  }

  const handleSaveName = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!supabase || !currentUser) return

    const normalized = normalizeName(nameDraft)
    if (normalized.length < 2) {
      setErrorMessage('Pick a name between 2 and 40 characters.')
      setNotice(null)
      return
    }

    if (!profilesTableAvailable) {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`guestbook-name:${currentUser.id}`, normalized)
      }

      setSavedName(normalized)
      setNameDraft(normalized)
      setErrorMessage(null)
      setNotice('Name saved locally. Create guestbook_profiles table to sync it.')
      return
    }

    setIsSavingName(true)
    setErrorMessage(null)
    setNotice(null)

    const { error } = await supabase.from('guestbook_profiles').upsert(
      {
        user_id: currentUser.id,
        email: currentUser.email ?? null,
        display_name: normalized,
        avatar_url: getAvatarUrl(currentUser),
        provider: pickString(currentUser.app_metadata?.provider),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )

    if (error) {
      if (hasMissingTableError(error, 'guestbook_profiles')) {
        setProfilesTableAvailable(false)

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(`guestbook-name:${currentUser.id}`, normalized)
        }

        setSavedName(normalized)
        setNameDraft(normalized)
        setNotice('Name saved locally. Create guestbook_profiles table to sync it.')
      } else {
        setErrorMessage(formatError(error))
      }
    } else {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(`guestbook-name:${currentUser.id}`)
      }
      setSavedName(normalized)
      setNameDraft(normalized)
      setNotice('Name saved.')
    }

    setIsSavingName(false)
  }

  const handlePost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!supabase || !currentUser) return

    if (!entriesTableAvailable) {
      setErrorMessage(
        'guestbook_entries table is missing in Supabase. Run the SQL setup first.',
      )
      setNotice(null)
      return
    }

    if (!savedName || savedName.length < 2) {
      setErrorMessage('Save your guestbook name before posting.')
      setNotice(null)
      return
    }

    const body = messageDraft.trim()
    if (body.length < 1) {
      setErrorMessage('Write a short message first.')
      setNotice(null)
      return
    }

    if (body.length > ENTRY_LIMIT) {
      setErrorMessage(`Message must be ${ENTRY_LIMIT} characters or less.`)
      setNotice(null)
      return
    }

    setIsPosting(true)
    setErrorMessage(null)
    setNotice(null)

    const { error } = await supabase.from('guestbook_entries').insert({
      user_id: currentUser.id,
      display_name: savedName,
      avatar_url: getAvatarUrl(currentUser),
      provider: pickString(currentUser.app_metadata?.provider),
      message: body,
    })

    if (error) {
      if (hasMissingTableError(error, 'guestbook_entries')) {
        setEntriesTableAvailable(false)
        setErrorMessage(
          'guestbook_entries table is missing in Supabase. Run the SQL setup first.',
        )
      } else {
        setErrorMessage(formatError(error))
      }
    } else {
      setEntriesTableAvailable(true)
      setMessageDraft('')
      setNotice('Signed the guestbook.')
      await loadEntries()
    }

    setIsPosting(false)
  }

  if (!supabase) {
    return (
      <div className='rounded-lg border border-[var(--color-rurikon-border)] bg-[var(--surface-soft)]/55 px-4 py-4 sm:px-5'>
        <p className='text-rurikon-500'>
          Guestbook is disabled right now.
          <br />
          Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to enable auth and entries.
        </p>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <section className='rounded-lg border border-[var(--color-rurikon-border)] bg-[var(--surface-soft)]/55 px-4 py-4 sm:px-5'>
        {isLoading ? (
          <p className='text-rurikon-400'>Loading guestbook...</p>
        ) : !currentUser ? (
          <div className='space-y-4'>
            <p className='text-rurikon-500'>
              Sign in to leave a message. Pick any provider:
            </p>
            <div className='grid grid-cols-1 gap-2 sm:grid-cols-3'>
              {OAUTH_PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  type='button'
                  className={`${BUTTON_CLASS} w-full justify-center gap-2 whitespace-nowrap`}
                  disabled={isAuthBusy}
                  onClick={() => {
                    void handleSignIn(provider.id)
                  }}
                >
                  <ProviderIcon provider={provider.id} className='h-4 w-4 shrink-0' />
                  <span>{provider.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className='space-y-6'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex min-w-0 items-center gap-3'>
                <div
                  aria-hidden='true'
                  className='h-10 w-10 shrink-0 rounded-full border border-[var(--color-rurikon-border)] bg-[var(--frame-background)] text-rurikon-400 bg-cover bg-center'
                  style={
                    currentAvatar
                      ? { backgroundImage: `url(${currentAvatar})` }
                      : undefined
                  }
                >
                  {!currentAvatar ? (
                    <span className='flex h-full w-full items-center justify-center text-xs uppercase'>
                      {(savedName || currentUser.email || '?').slice(0, 1)}
                    </span>
                  ) : null}
                </div>
                <div className='min-w-0'>
                  <p className='truncate font-medium text-rurikon-700'>
                    {currentUser.email ?? 'Authenticated user'}
                  </p>
                  <p className='inline-flex items-center gap-1.5 text-rurikon-400 text-sm'>
                    <ProviderIcon provider={currentProviderRaw} className='h-3.5 w-3.5' />
                    <span>Provider: {currentProvider}</span>
                  </p>
                </div>
              </div>

              <button
                type='button'
                className={`${BUTTON_CLASS} w-full sm:w-auto`}
                onClick={() => {
                  void handleSignOut()
                }}
                disabled={isAuthBusy}
              >
                Sign out
              </button>
            </div>

            <form className='space-y-2' onSubmit={handleSaveName}>
              <label htmlFor='guestbook-name' className='text-rurikon-500'>
                Select your guestbook name
              </label>
              <input
                id='guestbook-name'
                name='guestbook-name'
                list='guestbook-name-options'
                className={INPUT_CLASS}
                value={nameDraft}
                placeholder='Name shown on your messages'
                maxLength={40}
                onChange={(event) => {
                  setNameDraft(event.target.value)
                }}
              />
              {nameOptions.length > 0 ? (
                <datalist id='guestbook-name-options'>
                  {nameOptions.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              ) : null}

              <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                <p className='text-rurikon-400 text-sm'>
                  {savedName
                    ? `Current name: ${savedName}`
                    : 'Save a name before posting.'}
                </p>
                <button
                  type='submit'
                  className={`${BUTTON_CLASS} w-full sm:w-auto`}
                  disabled={isSavingName}
                >
                  {isSavingName ? 'Saving...' : savedName ? 'Update name' : 'Save name'}
                </button>
              </div>
              {!profilesTableAvailable ? (
                <p className='text-rurikon-400 text-sm'>
                  Profile table is missing in Supabase. Name is saved locally for now.
                </p>
              ) : null}
            </form>

            <form className='space-y-2' onSubmit={handlePost}>
              <label htmlFor='guestbook-message' className='text-rurikon-500'>
                Message
              </label>
              <textarea
                id='guestbook-message'
                name='guestbook-message'
                className={INPUT_CLASS}
                rows={4}
                maxLength={ENTRY_LIMIT}
                placeholder='Write something nice...'
                value={messageDraft}
                disabled={!canPost}
                onChange={(event) => {
                  setMessageDraft(event.target.value)
                }}
              />
              <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
                <p className='text-rurikon-400 text-sm'>
                  {trimmedMessageLength}/{ENTRY_LIMIT}
                </p>
                <button
                  type='submit'
                  className={`${BUTTON_CLASS} w-full sm:w-auto`}
                  disabled={
                    !canPost ||
                    !entriesTableAvailable ||
                    isPosting ||
                    trimmedMessageLength === 0
                  }
                >
                  {isPosting ? 'Posting...' : 'Sign guestbook'}
                </button>
              </div>
              {!entriesTableAvailable ? (
                <p className='text-rurikon-400 text-sm'>
                  Entries table is missing in Supabase. Run SQL setup section 5.
                </p>
              ) : null}
            </form>
          </div>
        )}

        {notice ? <p className='mt-4 text-rurikon-500'>{notice}</p> : null}
        {errorMessage ? (
          <p className='mt-4 text-rurikon-500 underline decoration-rurikon-300'>
            {errorMessage}
          </p>
        ) : null}
      </section>

      <section style={{ contentVisibility: 'auto' }}>
        <h2 className='text-rurikon-600 font-medium'>Recent entries</h2>
        {!entriesTableAvailable ? (
          <p className='mt-3 text-rurikon-400'>
            Entries table not found. Create <code>guestbook_entries</code> in
            Supabase SQL editor.
          </p>
        ) : entries.length === 0 ? (
          <p className='mt-3 text-rurikon-400'>
            No entries yet. Be the first one to sign.
          </p>
        ) : (
          <ul className='mt-2 divide-y divide-[var(--color-rurikon-border)]'>
            {entries.map((entry) => (
              <li
                key={entry.id}
                className='py-4'
                style={{ contentVisibility: 'auto' }}
              >
                <article className='flex gap-3'>
                  <div
                    aria-hidden='true'
                    className='mt-0.5 h-9 w-9 shrink-0 rounded-full border border-[var(--color-rurikon-border)] bg-[var(--frame-background)] text-rurikon-400 bg-cover bg-center'
                    style={
                      entry.avatar_url
                        ? { backgroundImage: `url(${entry.avatar_url})` }
                        : undefined
                    }
                  >
                    {!entry.avatar_url ? (
                      <span className='flex h-full w-full items-center justify-center text-xs uppercase'>
                        {entry.display_name.slice(0, 1)}
                      </span>
                    ) : null}
                  </div>

                  <div className='min-w-0 flex-1'>
                    <header className='flex flex-wrap items-baseline gap-x-2 gap-y-1'>
                      <span className='font-medium text-rurikon-700'>
                        {entry.display_name}
                      </span>
                      <span className='inline-flex items-center gap-1 text-rurikon-300 text-sm'>
                        <ProviderIcon provider={entry.provider} className='h-3.5 w-3.5' />
                        <span>via {providerLabel(entry.provider)}</span>
                      </span>
                      <time
                        dateTime={entry.created_at}
                        className='text-rurikon-300 text-sm'
                      >
                        {formatDate(entry.created_at)}
                      </time>
                    </header>
                    <p className='mt-1 whitespace-pre-wrap text-rurikon-500'>
                      {entry.message}
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
