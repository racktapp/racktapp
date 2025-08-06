
'use client';
import { Tournament } from '@/lib/types';
import { MatchupCard } from './matchup-card';

interface TournamentBracketProps {
  tournament: Tournament;
  currentUserId: string;
  onUpdate: () => void;
}

export function TournamentBracket({ tournament, currentUserId, onUpdate }: TournamentBracketProps) {
  const isOrganizer = tournament.organizerId === currentUserId;

  return (
    <div className="flex gap-4 md:gap-8 overflow-x-auto pb-4">
      {tournament.bracket.map((round, roundIndex) => (
        <div key={round.roundNumber} className="flex flex-col gap-8 min-w-[250px]">
          <h3 className="text-lg font-bold text-center">
            {roundIndex === tournament.bracket.length - 1 ? 'Final' : `Round ${round.roundNumber}`}
          </h3>
          <div className="flex flex-col gap-6">
            {round.matches.map((match) => (
              <MatchupCard
                key={match.id}
                match={match}
                tournamentId={tournament.id}
                participants={tournament.participantsData}
                isOrganizer={isOrganizer}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
