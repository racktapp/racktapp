// NO "use client" here — this is a server component
import ClientView from './ClientView';

// This tells Next.js to not fail if a param is not in generateStaticParams,
// and instead render it on the client. This is crucial for `output: 'export'`.
export const dynamicParams = true;

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
