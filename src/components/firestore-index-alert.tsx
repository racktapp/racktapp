'use client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Terminal } from 'lucide-react';

interface FirestoreIndexAlertProps {
  message: string;
}

const urlRegex = /(https?:\/\/[^\s]+)/;

export function FirestoreIndexAlert({ message }: FirestoreIndexAlertProps) {
  const urlMatch = message.match(urlRegex);
  const url = urlMatch ? urlMatch[0] : null;
  const text = url ? message.replace(url, '').replace(/ You can create it here: $/, '') : message;

  return (
    <Alert variant="destructive">
      <Terminal className="h-4 w-4" />
      <AlertTitle>Database Index Required</AlertTitle>
      <AlertDescription>
        <p className="mb-4">{text}</p>
        {url && (
          <Button asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              Create Index in Firebase Console
            </a>
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
