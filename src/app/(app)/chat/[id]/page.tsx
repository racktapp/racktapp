// NO "use client" here — this is a server component
import ClientView from "./ClientView";

// Stub out static export for chat pages:
export async function generateStaticParams() {
  return [];  // no chat pages to pre-render
}

interface PageProps {
  params: { id: string };
}

export default function ChatPage({ params }: PageProps) {
  return <ClientView id={params.id} />;
}
