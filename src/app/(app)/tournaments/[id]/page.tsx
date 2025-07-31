// NO "use client" here — this is a server component
import ClientView from "./ClientView";

// Stub out static export for tournament pages:
export async function generateStaticParams() {
  return [];  // no tournament pages to pre-render
}

interface PageProps {
  params: { id: string };
}

export default function TournamentPage({ params }: PageProps) {
  return <ClientView id={params.id} />;
}
