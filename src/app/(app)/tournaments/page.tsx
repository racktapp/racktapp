
'use client';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Plus, Trophy } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getTournamentsForUserAction } from '@/lib/actions';
import { Tournament } from '@/lib/types';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { CreateTournamentDialog } from '@/components/tournaments/create-tournament-dialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'next/navigation';
import ClientView from './[id]/ClientView';

function TournamentListItem({ tournament, className, ...props }: { tournament: Tournament, className?: string, [key:string]: any }) {
    return (
        <Card className={cn(className)} {...props}>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>{tournament.name}</CardTitle>
                        <CardDescription>{tournament.sport} • {tournament.participantIds.length} players</CardDescription>
                    </div>
                    <Badge variant={tournament.status === 'complete' ? 'default' : 'secondary'} className="capitalize">
                        {tournament.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardFooter>
                <Button asChild>
                    <Link href={`/tournaments?id=${tournament.id}`}>
                        View Bracket
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
}

function TournamentsListPage() {
    const { user } = useAuth();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTournaments = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        const userTournaments = await getTournamentsForUserAction(user.uid);
        setTournaments(userTournaments);
        setIsLoading(false);
    }, [user]);

    useEffect(() => {
        fetchTournaments();
    }, [fetchTournaments]);

    if (!user) return null;

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <PageHeader
                title="Tournaments"
                description="Create and compete in single-elimination brackets."
                actions={
                    <CreateTournamentDialog user={user} onTournamentCreated={fetchTournaments}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Tournament
                        </Button>
                    </CreateTournamentDialog>
                }
            />
            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <LoadingSpinner className="h-8 w-8" />
                </div>
            ) : tournaments.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {tournaments.map((t, i) => (
                        <TournamentListItem 
                            key={t.id} 
                            tournament={t} 
                            className="opacity-0 animate-fade-in-slide-up"
                            style={{ animationDelay: `${i * 100}ms` }}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed">
                    <Trophy className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">You haven't joined any tournaments yet.</p>
                    <p className="text-sm text-muted-foreground">Create one to get started!</p>
                </div>
            )}
        </div>
    );
}

function TournamentsPageContent() {
    const searchParams = useSearchParams();
    const tournamentId = searchParams.get('id');

    if (tournamentId) {
        return <ClientView tournamentId={tournamentId} />;
    }

    return <TournamentsListPage />;
}

export default function TournamentsPage() {
    return (
        <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><LoadingSpinner /></div>}>
            <TournamentsPageContent />
        </Suspense>
    )
}
