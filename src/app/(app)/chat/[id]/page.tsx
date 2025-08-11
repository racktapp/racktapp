import ClientView from "./ClientView";

export default function Page(props: any) {
  const id = props?.params?.id as string;
  return <ClientView chatId={id} />;
}

export function generateStaticParams() {
  return [];
}

export const dynamicParams = true;

