
'use client';
import ProfileClientView from './ClientView';

export const dynamicParams = false;

export function generateStaticParams() {
  return [];
}

export default function Page() {
    return <ProfileClientView />
}
