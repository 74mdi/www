declare module 'exif-reader' {
  type ExifReaderTags = Record<string, string | number | Date | undefined>
  type ExifReaderOutput = {
    image?: ExifReaderTags
    exif?: ExifReaderTags
  }

  const exifReader: (buffer: Buffer) => ExifReaderOutput
  export default exifReader
}
