import dynamic from 'next/dynamic';

const ClientView = dynamic(() => import('./ClientView'));

export default function RallyGamePage() {
  return <ClientView />;
}

export async function generateStaticParams() {
  const ids = ['demo1', 'demo2', 'demo3'];
  return ids.map((id) => ({ id }));
}
