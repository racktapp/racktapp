'use client';

import { useState } from 'react';
import { Match } from '@/lib/types';
import { format } from 'date-fns';
import { handleRecapAction } from '@/lib/actions';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Bot, Sparkles, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MatchHistoryCardProps {
  match: Match;
  currentUserId: string;
}

export function MatchHistoryCard({ match, currentUserId }: MatchHistoryCardProps) {
  const { toast } = useToast();
  const [recap, setRecap] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isWinner = match.winner.includes(currentUserId);
  const isSingles = match.type === 'Singles';

  const myTeamIds = match.teams.team1.playerIds.includes(currentUserId) ? match.teams.team1.playerIds : match.teams.team2.playerIds;
  const opponentTeamIds = match.teams.team1.playerIds.includes(currentUserId) ? match.teams.team2.playerIds : match.teams.team1.playerIds;

  const partner = myTeamIds.find(id => id !== currentUserId);
  const opponents = opponentTeamIds;

  const opponentDisplay = opponents.map(id => match.participantsData[id]?.name).join(' & ');

  const handleGenerateRecap = async () => {
    setIsLoading(true);
    setRecap(null);
    try {
      const result = await handleRecapAction(match);
      setRecap(result.recap);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate AI recap.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value={`match-${match.id}`} className="border rounded-lg">
        <AccordionTrigger className="p-4 hover:no-underline">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4 text-left">
              <Badge variant={isWinner ? 'default' : 'destructive'} className={isWinner ? 'bg-green-500/20 text-green-700 border-transparent' : 'bg-red-500/20 text-red-700 border-transparent'}>
                {isWinner ? 'Win' : 'Loss'}
              </Badge>
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                 <div className="font-semibold">vs {opponentDisplay}</div>
                 <div className="text-muted-foreground">{match.score}</div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground hidden sm:block">
              {format(new Date(match.date), 'MMM d, yyyy')}
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-4 pt-0">
            <div className="space-y-4">
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    <div><span className="font-medium text-foreground">Date:</span> {format(new Date(match.date), 'PPP')}</div>
                    <div><span className="font-medium text-foreground">Sport:</span> {match.sport}</div>
                    <div><span className="font-medium text-foreground">Type:</span> {match.type}</div>
                    {!isSingles && partner && <div><span className="font-medium text-foreground">Partner:</span> {match.participantsData[partner]?.name}</div>}
                </div>

                {!recap && !isLoading && (
                    <Button variant="outline" size="sm" onClick={handleGenerateRecap}>
                        <Bot className="mr-2 h-4 w-4" />
                        Generate Recap with AI
                    </Button>
                )}
                
                {isLoading && (
                     <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Generating recap...</span>
                    </div>
                )}

                {recap && (
                    <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                         <div className="flex items-center gap-2">
                             <Sparkles className="h-5 w-5 text-primary"/>
                             <h4 className="font-semibold">AI Match Recap</h4>
                         </div>
                        <p className="text-sm italic">"{recap}"</p>
                    </div>
                )}
            </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
