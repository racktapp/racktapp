"use client";

interface ClientViewProps {
  chatId: string;
}

export default function ClientView({ chatId }: ClientViewProps) {
  return <div>{`Chat ${chatId}`}</div>;
}

