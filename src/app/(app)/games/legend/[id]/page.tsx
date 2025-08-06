// NO "use client" here — this is a server component
import ClientView from "./ClientView";

// Stub out static export for game pages:
export async function generateStaticParams() {
  return [];  // no game pages to pre-render
}

interface PageProps {
  params: { id: string };
}

// The PageProps interface has been corrected to fix the build error.
export default function LegendGamePage({ params }: PageProps) {
  return <ClientView params={params} />;
}
