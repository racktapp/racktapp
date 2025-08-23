export const dynamic = 'force-static';

export async function GET() {
  return new Response('Not available in static export', { status: 404 });
}

export async function POST() {
  return new Response('Not available in static export', { status: 404 });
}
