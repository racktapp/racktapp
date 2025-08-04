

'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Dumbbell } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useSport } from '@/components/providers/sport-provider';
import { useToast } from '@/hooks/use-toast';
import { getPracticeSessionsAction } from '@/lib/actions';
import { PracticeSession } from '@/lib/types';
import { CreatePracticeLogDialog } from '@/components/practice/create-practice-log-dialog';
import { PracticeSessionCard } from '@/components/practice/practice-session-card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { FirestoreIndexAlert } from '@/components/firestore-index-alert';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default function PracticeLogPage() {
  const { user } = useAuth();
  const { sport } = useSport();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getPracticeSessionsAction(user.uid, sport);
      if (result.success) {
        setSessions(result.data || []);
      } else {
        // The full error message, including the URL, will be in result.error
        setError(result.error);
      }
    } catch (err: any) {
      // Also catch any unexpected errors during the action call itself
      setError(err.message || "An unexpected error occurred.");
    }
    setIsLoading(false);
  }, [user, sport]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      );
    }
    if (error) {
       // This is a fallback in case the automatic link generation fails.
       // It provides manual instructions.
      return (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Database Index Required</AlertTitle>
          <AlertDescription>
            <p className="mb-2">To view practice logs, a specific database index needs to be created in your Firebase project. This is a one-time setup.</p>
            <p className="font-semibold">Please create the following composite index in your Firestore console:</p>
            <ul className="list-disc pl-5 mt-2 text-xs bg-muted p-2 rounded-md font-mono">
                <li>Collection ID: `practiceSessions`</li>
                <li>Field 1: `userId` (Ascending)</li>
                <li>Field 2: `sport` (Ascending)</li>
                <li>Field 3: `date` (Descending)</li>
            </ul>
            <p className="mt-2 text-xs">After the index is built (status becomes "Enabled"), this page will work correctly.</p>
          </AlertDescription>
        </Alert>
      );
    }
    if (sessions.length === 0) {
      return (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed">
            <Dumbbell className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">You haven't logged any {sport} practice sessions yet.</p>
            <p className="text-sm text-muted-foreground">Log your first session to start tracking your progress!</p>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {sessions.map((session, i) => (
          <PracticeSessionCard 
            key={session.id} 
            session={session} 
            className="opacity-0 animate-fade-in-slide-up"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    );
  };
  
  if (!user) return null;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Practice Log"
        description={`Track your ${sport} training sessions and monitor your progress.`}
        actions={
          <CreatePracticeLogDialog onSessionLogged={fetchSessions}>
            <Button>
              <Dumbbell className="mr-2 h-4 w-4" />
              Log Practice Session
            </Button>
          </CreatePracticeLogDialog>
        }
      />
      {renderContent()}
    </div>
  );
}
