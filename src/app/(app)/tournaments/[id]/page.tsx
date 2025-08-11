
import ClientView from "./ClientView";

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function Page({ params }: { params: { id: string } }) {
  return <ClientView tournamentId={params.id} />;
}
