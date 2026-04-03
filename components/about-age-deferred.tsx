'use client'

import dynamic from 'next/dynamic'

const AboutAgeClient = dynamic(
  () =>
    import('@/components/about-age-client').then(
      (module) => module.AboutAgeClient,
    ),
  {
    ssr: false,
    loading: () => <AboutAgeFallback />,
  },
)

function AboutAgeFallback() {
  return (
    <section className='mt-12' style={{ contentVisibility: 'auto' }}>
      <div className='flex flex-wrap items-center gap-3'>
        <h2 className='m-0 font-semibold text-[1.3rem] leading-[1.2] sm:text-[1.52rem] text-rurikon-600'>
          About Me
        </h2>
      </div>

      <p className='mt-5'>ana حمدي.</p>
      <p className='mt-3'>wsafi.</p>
    </section>
  )
}

export function AboutAgeDeferred() {
  return <AboutAgeClient />
}
