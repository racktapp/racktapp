
import ClientView from './ClientView';

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function RallyGameClientPage({ params }: { params: { id: string } }) {
  return <ClientView gameId={params.id} />;
}
