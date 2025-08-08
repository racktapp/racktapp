import { adminDb } from "@/lib/firebase/admin-config";
import ClientView from "./ClientView";

export const dynamicParams = false;

export async function generateStaticParams() {
  try {
    const snapshot = await adminDb.collection("chats").get();
    return snapshot.docs.map((doc) => ({ id: doc.id }));
  } catch (error) {
    console.error("Failed to fetch chat IDs", error);
    return [];
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
