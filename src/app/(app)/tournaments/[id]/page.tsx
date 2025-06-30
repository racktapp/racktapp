'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { useAuth } from '@/hooks/use-auth';
import { getTournamentByIdAction } from '@/lib/actions';
import { Tournament } from '@/lib/types';
import { Loader2, Trophy, ArrowLeft } from 'lucide-react';
import { TournamentBracket } from '@/components/tournaments/tournament-bracket';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TournamentPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : undefined;

  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTournament = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const tournamentData = await getTournamentByIdAction(id);
    setTournament(tournamentData);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchTournament();
  }, [fetchTournament]);

  if (loading || !user) {
    return (
      <div className="container mx-auto flex h-full w-full items-center justify-center p-4 md:p-6 lg:p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <PageHeader title="Tournament Not Found" description="This tournament does not exist." />
        <Button asChild variant="outline">
          <Link href="/tournaments">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tournaments
          </Link>
        </Button>
      </div>
    );
  }

  const champion = tournament.status === 'complete' 
    ? tournament.participantsData.find(p => p.uid === tournament.winnerId)
    : null;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title={tournament.name}
        description={`A ${tournament.sport} single-elimination tournament.`}
        actions={
          <Button asChild variant="outline">
            <Link href="/tournaments">
              <ArrowLeft className="mr-2 h-4 w-4" />
              All Tournaments
            </Link>
          </Button>
        }
      />

      {champion && (
        <div className="mb-8 flex flex-col items-center justify-center rounded-lg border-2 border-yellow-500 bg-yellow-500/10 p-6">
          <Trophy className="h-12 w-12 text-yellow-500" />
          <h2 className="mt-4 text-xl font-bold">Champion</h2>
          <p className="text-2xl font-bold text-yellow-600">{champion.name}</p>
        </div>
      )}

      <TournamentBracket tournament={tournament} currentUserId={user.uid} onUpdate={fetchTournament} />
    </div>
  );
}
