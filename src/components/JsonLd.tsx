// Renders a <script type="application/ld+json"> for schema.org structured data.
// Escapes `<` (→ <) inside the serialised payload so user-supplied fields
// (e.g. a photo `story` containing "</script>") can't break out and inject
// markup. This is the XSS-safety pattern called out in the Next.js JSON-LD
// guide: https://nextjs.org/docs/app/guides/json-ld

type Plain = Record<string, unknown> | Array<Record<string, unknown>>;

export default function JsonLd({ data }: { data: Plain }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      // The `<` characters are escaped above; this is safe.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
