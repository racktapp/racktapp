
// NO "use client" here — this is a server component

// 1) Stub out static paths:
export async function generateStaticParams() {
  return [];  // no pages to pre-render
}

import { ChatView } from "@/components/chat/chat-view";
import ClientView from "./ClientView";

interface PageProps {
  params: { id: string };
}

export default function ChatPage({ params }: PageProps) {
  return <ClientView id={params.id} />;
}
