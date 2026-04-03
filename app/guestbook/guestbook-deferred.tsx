'use client'

import dynamic from 'next/dynamic'

const GuestbookClient = dynamic(() => import('@/app/guestbook/guestbook-client'), {
  ssr: false,
  loading: () => <GuestbookShell />,
})

function GuestbookShell() {
  return (
    <div className='space-y-6'>
      <section className='rounded-lg border border-[var(--color-rurikon-border)] bg-[var(--surface-soft)]/55 px-4 py-4 sm:px-5'>
        <p className='text-rurikon-500'>Loading guestbook...</p>
        <p className='mt-2 text-sm text-rurikon-400'>
          Sign in with Discord, GitHub, or Google once the interactive part is
          ready.
        </p>
      </section>

      <section style={{ contentVisibility: 'auto' }}>
        <h2 className='font-medium text-rurikon-600'>Recent entries</h2>
        <p className='mt-3 text-rurikon-400'>Loading entries...</p>
      </section>
    </div>
  )
}

export default function GuestbookDeferred() {
  return <GuestbookClient />
}
