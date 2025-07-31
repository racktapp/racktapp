
export async function generateStaticParams() {
  return [] 
}

import ClientView from "./ClientView";

interface PageProps {
  params: { id: string };
}

export default function TournamentPage({ params }: PageProps) {
  return <ClientView id={params.id} />;
}
