// Tell Next.js “no static chat pages are needed”
export async function generateStaticParams() {
  return [];
}

// NO "use client" here—this is a server component
import ClientView from "./ClientView";

interface PageProps {
  params: { id: string };
}

export default function ChatPage({ params }: PageProps) {
  return <ClientView id={params.id} />;
}
