type JsonLdProps = {
  data: Record<string, unknown>;
};

// Emits one JSON-LD <script>. Render multiple siblings for multiple schemas.
// Lives in the React tree (server component), not in generateMetadata.
const JsonLd = ({ data }: JsonLdProps) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
  />
);

export default JsonLd;
