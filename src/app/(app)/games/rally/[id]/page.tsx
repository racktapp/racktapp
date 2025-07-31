// NO "use client" here — this is a server component
import ClientView from './ClientView';

// Stub out static export for game pages:
export async function generateStaticParams() {
  return [];  // no game pages to pre-render
}

interface PageProps {
  params: { id: string };
}

export default function RallyGamePage({ params }: PageProps) {
  return <ClientView id={params.id} />;
}
