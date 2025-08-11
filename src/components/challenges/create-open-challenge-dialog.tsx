'use client';

import { ReactNode, useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { SPORTS } from '@/lib/constants';
import { type User, openChallengeSchema } from '@/lib/types';
import { createOpenChallengeAction } from '@/lib/actions';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useUserLocation } from '@/hooks/use-user-location';

interface CreateOpenChallengeDialogProps {
  user: User;
  children: ReactNode;
  onChallengeCreated: () => void;
  friends: User[]; // This prop is needed for the dialog to function.
}

export function CreateOpenChallengeDialog({ user, children, onChallengeCreated, friends }: CreateOpenChallengeDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof openChallengeSchema>>({
    resolver: zodResolver(openChallengeSchema),
    defaultValues: {
      sport: user.preferredSports[0] || SPORTS[0],
      location: '',
      latitude: undefined,
      longitude: undefined,
      note: '',
    },
  });

  const { latitude, longitude } = useUserLocation();

  useEffect(() => {
    if (latitude && longitude) {
        form.setValue('latitude', latitude);
        form.setValue('longitude', longitude);
    }
  }, [latitude, longitude, form]);

  async function onSubmit(values: z.infer<typeof openChallengeSchema>) {
    setIsLoading(true);
    const result = await createOpenChallengeAction(values, user);
    if (result.success) {
      toast({ title: 'Success!', description: 'Your open challenge has been posted.' });
      onChallengeCreated();
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Post Open Challenge</DialogTitle>
          <DialogDescription>Post a public challenge for anyone to accept.</DialogDescription>
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
            <FormField control={form.control} name="location" render={({ field }) => (<FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="e.g. City Park Courts" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <input type="hidden" {...form.register('latitude', { valueAsNumber: true })} />
            <input type="hidden" {...form.register('longitude', { valueAsNumber: true })} />
            <FormField control={form.control} name="note" render={({ field }) => (<FormItem><FormLabel>Note (optional)</FormLabel><FormControl><Textarea placeholder="e.g. Looking for a friendly match after 5pm." {...field} /></FormControl><FormMessage /></FormItem>)} />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
                Post Challenge
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
