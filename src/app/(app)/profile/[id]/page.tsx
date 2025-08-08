
import ProfileClientView from './ClientView';

export default function Page() {
    return <ProfileClientView />
}

export function generateStaticParams() {
    return [{ id: 'placeholder' }];
}
