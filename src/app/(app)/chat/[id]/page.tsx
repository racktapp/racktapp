
import ClientView from "./ClientView";

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function ChatPage({ params }: { params: { id: string } }) {
  return <ClientView id={params.id} />;
}
