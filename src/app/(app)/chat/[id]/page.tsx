// NO "use client" here — this is a server component
import ClientView from "./ClientView";

// Tell Next.js “I don’t need any static chat/[id] pages”
export async function generateStaticParams() {
  return []; 
}

interface PageProps {
  params: { id: string };
}

export default function ChatPage({ params }: PageProps) {
  return <ClientView id={params.id} />;
}
