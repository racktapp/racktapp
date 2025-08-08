import ProfileClientView from "./ClientView";

export async function generateStaticParams() {
  try {
    const { adminDb } = await import("@/lib/firebase/admin-config");
    const snapshot = await adminDb.collection("users").get();
    const ids = snapshot.docs.map((doc) => ({ id: doc.id }));
    return ids.length ? ids : [{ id: "stub" }];
  } catch (error) {
    console.error("Failed to fetch user IDs", error);
    return [{ id: "stub" }];
  }
}

export default function Page() {
  return <ProfileClientView />;
}
