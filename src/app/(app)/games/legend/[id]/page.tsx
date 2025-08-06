
'use client';
import ClientView from "./ClientView";

// This is a workaround for a build error.
export default function Page({ params }: { params: { id: string } }) {
  return <ClientView params={params} />;
}
