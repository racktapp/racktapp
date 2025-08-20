"use client";

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase/config';

export function ExportUserData() {
  const { user } = useAuth();

  const handleExport = async () => {
    if (!user || !auth.currentUser) return;
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/export-user-data?userId=${user.uid}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to export data');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'user-data.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export data', err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Download /> Export Data</CardTitle>
        <CardDescription>Download a copy of your data.</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button variant="outline" onClick={handleExport} disabled={!user} className="w-full sm:w-auto">
          Download JSON
        </Button>
      </CardFooter>
    </Card>
  );
}

