
'use client';

import { ReactNode, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { predictFriendMatchAction, getFriendsAction } from '@/lib/actions';
import { type PredictMatchOutput, type User } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useSport } from '@/components/providers/sport-provider';
import { BrainCircuit, Star, Users, BarChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '../ui/badge';

export function MatchPredictorDialog({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { sport } = useSport();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<(PredictMatchOutput & { winnerName: string }) | null>(null);

  useEffect(() => {
    if (open && user) {
      setIsLoading(true);
      getFriendsAction(user.uid).then(setFriends).finally(() => setIsLoading(false));
    }
  }, [open, user]);

  async function handlePredict() {
    if (!user) {
        toast({variant: 'destructive', title: 'Authentication error.'});
        return;
    }
    if (!selectedFriendId) {
        toast({variant: 'destructive', title: 'Please select a friend.'})
        return;
    }
    setIsLoading(true);
    setResult(null);
    try {
      const prediction = await predictFriendMatchAction(user.uid, selectedFriendId, sport);
      const winnerName = prediction.predictedWinner === 'player1' 
        ? user!.username 
        : friends.find(f => f.uid === selectedFriendId)!.username;
      setResult({ ...prediction, winnerName });
    } catch (error: any) {
      console.error('Prediction failed:', error);
      toast({variant: 'destructive', title: 'Prediction Failed', description: error.message});
    } finally {
      setIsLoading(false);
    }
  }

  const handleReset = () => {
    setSelectedFriendId('');
    setResult(null);
  };
  
  const onOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
        handleReset();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>AI Match Predictor</span>
            <Badge variant="outline">Beta</Badge>
          </DialogTitle>
          <DialogDescription>
            Select a friend to get an AI-powered prediction for a {sport} match.
          </DialogDescription>
        </DialogHeader>
        {!result ? (
            <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-sm font-medium">Opponent</label>
                    <Select onValueChange={setSelectedFriendId} value={selectedFriendId}>
                      <SelectTrigger disabled={isLoading}>
                        <SelectValue placeholder="Select a friend..." />
                      </SelectTrigger>
                      <SelectContent>
                        {friends.length > 0 ? (
                            friends.map((friend) => (
                                <SelectItem key={friend.uid} value={friend.uid}>
                                    {friend.username}
                                </SelectItem>
                            ))
                        ) : (
                            <div className="p-4 text-sm text-muted-foreground">No friends found.</div>
                        )}
                      </SelectContent>
                    </Select>
                </div>
              <DialogFooter>
                <Button onClick={handlePredict} disabled={isLoading || !selectedFriendId}>
                  {isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
                  Predict
                </Button>
              </DialogFooter>
            </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-card p-4 text-center">
              <p className="text-sm text-muted-foreground">Predicted Winner</p>
              <p className="text-2xl font-bold text-primary">
                {result.winnerName}
              </p>
              <div className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>Confidence: {result.confidence}</span>
              </div>
            </div>
            <div className="space-y-2">
                <h4 className="flex items-center font-semibold"><BrainCircuit className="mr-2 h-4 w-4" />AI Analysis</h4>
                <p className="text-sm text-muted-foreground">{result.analysis}</p>
            </div>
            <DialogFooter>
              <Button onClick={handleReset} variant="outline">
                New Prediction
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
