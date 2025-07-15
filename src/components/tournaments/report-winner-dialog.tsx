
'use client';
import { ReactNode, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { type User, type TournamentMatch } from '@/lib/types';
import { reportWinnerAction } from '@/lib/actions';
import { UserAvatar } from '../user-avatar';
import { LoadingSpinner } from '@/components/ui/loading-spinner';


interface ReportWinnerDialogProps {
  children: ReactNode;
  tournamentId: string;
  match: TournamentMatch;
  player1: User;
  player2: User;
  onReported: () => void;
}

const formSchema = z.object({
  winnerId: z.string({ required_error: 'Please select a winner.' }),
});

export function ReportWinnerDialog({ children, tournamentId, match, player1, player2, onReported }: ReportWinnerDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const result = await reportWinnerAction(tournamentId, match.id, values.winnerId);
    if (result.success) {
      toast({ title: 'Winner Reported!', description: 'The bracket has been updated.' });
      onReported();
      setOpen(false);
      form.reset();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setIsLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Report Winner</DialogTitle>
          <DialogDescription>Select the winner for this match.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="winnerId"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="space-y-2">
                        {[player1, player2].map((player) => (
                            <FormItem key={player.uid} className='rounded-md border p-3 has-[:checked]:border-primary'>
                                <FormControl>
                                    <div className='flex items-center justify-between'>
                                        <div className='flex items-center gap-2'>
                                            <UserAvatar user={player} className='h-8 w-8' />
                                            <FormLabel className='font-normal'>@{player.username}</FormLabel>
                                        </div>
                                        <RadioGroupItem value={player.uid} />
                                    </div>
                                </FormControl>
                            </FormItem>
                        ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
                Confirm Winner
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
