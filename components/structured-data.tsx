type StructuredDataProps = {
  data: Record<string, unknown> | Array<Record<string, unknown>>
}

function serializeStructuredData(entry: Record<string, unknown>) {
  return JSON.stringify(entry).replace(/</g, '\\u003c')
}

export default function StructuredData({ data }: StructuredDataProps) {
  const entries = Array.isArray(data) ? data : [data]

  return (
    <>
      {entries.map((entry, index) => (
        <script
          key={index}
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: serializeStructuredData(entry),
          }}
        />
      ))}
    </>
  )
}
