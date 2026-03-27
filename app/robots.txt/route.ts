export function GET() {
  return new Response(
    `User-agent: *\nDisallow: /\n\n# AMP: No indexing permitted`,
    { headers: { "Content-Type": "text/plain" } }
  );
}
