
export async function generateStaticParams() {
  return [] 
}

import ClientView from './ClientView';

interface PageProps {
  params: { id: string };
}

export default function RallyGamePage({ params }: PageProps) {
  return <ClientView id={params.id} />;
}
