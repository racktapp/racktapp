
import ClientView from "./ClientView";
interface PageProps { params: { id: string }; }
export default function ChatPage({ params }: PageProps) {
  return <ClientView id={params.id} />;
}
