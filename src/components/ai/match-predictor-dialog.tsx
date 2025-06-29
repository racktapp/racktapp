'use client';

import { ReactNode, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { predictMatchOutcome, PredictMatchInput, PredictMatchOutput } from '@/ai/flows/predict-match';
import { SPORTS } from '@/lib/constants';
import { Loader2, BrainCircuit, Star, BarChart } from 'lucide-react';

const formSchema = z.object({
  player1RacktRank: z.coerce.number().min(0),
  player1WinRate: z.coerce.number().min(0).max(1),
  player1Streak: z.coerce.number().int(),
  player2RacktRank: z.coerce.number().min(0),
  player2WinRate: z.coerce.number().min(0).max(1),
  player2Streak: z.coerce.number().int(),
  sport: z.enum(SPORTS),
});

export function MatchPredictorDialog({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictMatchOutput | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      player1RacktRank: 1500,
      player1WinRate: 0.5,
      player1Streak: 0,
      player2RacktRank: 1500,
      player2WinRate: 0.5,
      player2Streak: 0,
      sport: 'Tennis',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const prediction = await predictMatchOutcome(values);
      setResult(prediction);
    } catch (error) {
      console.error('Prediction failed:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleReset = () => {
    form.reset();
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>AI Match Predictor</DialogTitle>
          <DialogDescription>
            Enter player stats to get an AI-powered prediction on the match outcome.
          </DialogDescription>
        </DialogHeader>
        {!result ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 rounded-lg border p-4">
                  <h3 className="font-semibold">Player 1</h3>
                  <FormField control={form.control} name="player1RacktRank" render={({ field }) => ( <FormItem> <FormLabel>RacktRank</FormLabel> <FormControl> <Input type="number" {...field} /> </FormControl> </FormItem> )} />
                  <FormField control={form.control} name="player1WinRate" render={({ field }) => ( <FormItem> <FormLabel>Win Rate (0-1)</FormLabel> <FormControl> <Input type="number" step="0.01" {...field} /> </FormControl> </FormItem> )} />
                  <FormField control={form.control} name="player1Streak" render={({ field }) => ( <FormItem> <FormLabel>Streak</FormLabel> <FormControl> <Input type="number" {...field} /> </FormControl> </FormItem> )} />
                </div>
                <div className="space-y-2 rounded-lg border p-4">
                  <h3 className="font-semibold">Player 2</h3>
                  <FormField control={form.control} name="player2RacktRank" render={({ field }) => ( <FormItem> <FormLabel>RacktRank</FormLabel> <FormControl> <Input type="number" {...field} /> </FormControl> </FormItem> )} />
                  <FormField control={form.control} name="player2WinRate" render={({ field }) => ( <FormItem> <FormLabel>Win Rate (0-1)</FormLabel> <FormControl> <Input type="number" step="0.01" {...field} /> </FormControl> </FormItem> )} />
                  <FormField control={form.control} name="player2Streak" render={({ field }) => ( <FormItem> <FormLabel>Streak</FormLabel> <FormControl> <Input type="number" {...field} /> </FormControl> </FormItem> )} />
                </div>
              </div>
              <FormField
                control={form.control}
                name="sport"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sport</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a sport" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SPORTS.map((sport) => (
                          <SelectItem key={sport} value={sport}>
                            {sport}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Predict
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-card p-4 text-center">
              <p className="text-sm text-muted-foreground">Predicted Winner</p>
              <p className="text-2xl font-bold text-primary">
                {result.predictedWinner.charAt(0).toUpperCase() + result.predictedWinner.slice(1)}
              </p>
              <div className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>Confidence: {Math.round(result.confidence * 100)}%</span>
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
