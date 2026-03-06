import {
  createSimpleOgImage,
  OG_CONTENT_TYPE,
  OG_SIZE,
} from '@/app/_lib/og-image'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function OpenGraphImage() {
  return createSimpleOgImage({
    title: 'SIFTLI Project',
    description: 'salam ana 7amdi',
  })
}
