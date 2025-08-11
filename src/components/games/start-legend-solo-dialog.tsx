
'use client';
import { ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { SPORTS } from '@/lib/constants';
import { createLegendGameAction } from '@/lib/actions';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/hooks/use-auth';

const formSchema = z.object({
  sport: z.enum(SPORTS),
});

interface StartLegendSoloDialogProps {
  children: ReactNode;
}

export function StartLegendSoloDialog({ children }: StartLegendSoloDialogProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { sport: 'Tennis' },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to start a game.' });
      return;
    }
    setIsLoading(true);
    try {
      const result = await createLegendGameAction(null, values.sport, user.uid);
      if (result.success && result.redirect) {
        toast({ title: 'Game Started!', description: 'Good luck!' });
        router.push(result.redirect);
        setOpen(false);
      } else {
        // This will now catch errors from the action and display them
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Error Starting Game', 
        description: error.message || 'An unexpected error occurred. Please try again later.' 
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Play Solo</DialogTitle>
          <DialogDescription>Start a solo game of "Guess the Legend".</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="sport"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sport</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a sport" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>{SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
                Start Game
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
