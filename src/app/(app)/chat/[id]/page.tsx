import ClientView from "./ClientView";


export async function generateStaticParams() {
  try {
    const { adminDb } = await import("@/lib/firebase/admin-config");
    const snapshot = await adminDb.collection("chats").get();
    const ids = snapshot.docs.map((doc) => ({ id: doc.id }));
    return ids.length ? ids : [{ id: "stub" }];
  } catch (error) {
    console.error("Failed to fetch chat IDs", error);
    return [{ id: "stub" }];
  }
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClientView id={id} />;
}
