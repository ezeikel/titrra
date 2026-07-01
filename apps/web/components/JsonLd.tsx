type JsonLdProps = {
  data: Record<string, unknown>;
};

// Emits one JSON-LD <script>. Render multiple siblings for multiple schemas.
// Lives in the React tree (server component), not in generateMetadata.
const JsonLd = ({ data }: JsonLdProps) => (
  <script
    type="application/ld+json"
    // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
  />
);

export default JsonLd;
