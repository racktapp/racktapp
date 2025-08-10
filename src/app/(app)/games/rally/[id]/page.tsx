

import ClientView from './ClientView';

export default function Page() {
  return <ClientView />;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}
