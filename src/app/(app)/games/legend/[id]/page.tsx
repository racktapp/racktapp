
import ClientView from "./ClientView";

export default function Page() {
  return <ClientView />;
}

export function generateStaticParams() {
  return [{ id: 'placeholder' }];
}
