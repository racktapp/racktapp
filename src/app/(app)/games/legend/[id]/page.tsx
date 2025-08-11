
import ClientView from "./ClientView";

export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export default function LegendGameClientPage({ params }: { params: { id: string } }) {
  return <ClientView gameId={params.id} />;
}
