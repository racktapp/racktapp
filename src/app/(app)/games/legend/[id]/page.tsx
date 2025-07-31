
export async function generateStaticParams() {
  return [] 
}

import ClientView from "./ClientView";

interface PageProps {
  params: { id: string };
}

export default function LegendGamePage({ params }: PageProps) {
  return <ClientView id={params.id} />;
}
