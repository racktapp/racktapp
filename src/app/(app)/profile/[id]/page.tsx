
import ClientView from './ClientView';

interface PageProps {
  params: { id: string };
}

export default function ProfilePage({ params }: PageProps) {
    return <ClientView id={params.id} />
}
