
import ClientView from './ClientView';

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}

export default function ProfilePage({ params }: { params: { id: string } }) {
    return <ClientView id={params.id} />
}
