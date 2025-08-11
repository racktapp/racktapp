
import ClientView from "./ClientView";

export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export default function Page({ params }: { params: { id: string } }) {
  return <ClientView tournamentId={params.id} />;
}
