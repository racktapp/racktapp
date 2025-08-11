
import ClientView from './ClientView';

export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

export default function ProfilePage({ params }: { params: { id: string } }) {
    return <ClientView id={params.id} />
}
