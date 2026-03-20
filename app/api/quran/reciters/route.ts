import { NextResponse } from 'next/server'

type Reciter = {
  id: string
  label: string
  baseUrl: string
}

const RECITERS: Reciter[] = [
  {
    id: 'mahmoud_khalil_al_husary',
    label: 'Mahmoud Khalil Al-Husary',
    baseUrl: 'https://archive.org/download/MahmoudKhalilAl-husary',
  },
  {
    id: 'mishari_al_afasy',
    label: 'Mishari Alafasy',
    baseUrl: 'https://download.quranicaudio.com/qdc/mishari_al_afasy/murattal',
  },
  {
    id: 'abdurrahmaan_as_sudais',
    label: 'Abdurrahmaan As-Sudais',
    baseUrl: 'https://download.quranicaudio.com/qdc/abdurrahmaan_as_sudais/murattal',
  },
  {
    id: 'hani_ar_rifai',
    label: 'Hani Ar-Rifai',
    baseUrl: 'https://download.quranicaudio.com/qdc/hani_ar_rifai/murattal',
  },
  {
    id: 'abu_bakr_shatri',
    label: 'Abu Bakr Ash-Shaatree',
    baseUrl: 'https://download.quranicaudio.com/qdc/abu_bakr_shatri/murattal',
  },
  {
    id: 'khalil_al_husary',
    label: 'Khalil Al-Husary',
    baseUrl: 'https://download.quranicaudio.com/qdc/khalil_al_husary/murattal',
  },
  {
    id: 'abdul_baset_mujawwad',
    label: 'Abdul Baset Mujawwad',
    baseUrl: 'https://download.quranicaudio.com/qdc/abdul_baset/mujawwad',
  },
]

export async function GET() {
  return NextResponse.json<Reciter[]>(RECITERS, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
