export default function JsonLd({ data }: { data: object[] }) {
  return data.map((d, i) => (
    // Escape "<" so no string in the data can close the script tag.
    <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d).replace(/</g, '\\u003c') }} />
  ));
}
