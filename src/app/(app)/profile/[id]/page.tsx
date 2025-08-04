// NO "use client" here — this is a server component
import ClientView from './ClientView';

// Stub out static export for profile pages:
export async function generateStaticParams() {
    return []; // no profile pages to pre-render
}

interface PageProps {
  params: { id: string };
}

export default function ProfilePage({ params }: PageProps) {
    return <ClientView id={params.id} />
}
