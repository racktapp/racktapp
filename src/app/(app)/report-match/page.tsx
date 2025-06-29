'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/hooks/use-auth';
import { useSport } from '@/components/providers/sport-provider';
import { getFriends } from '@/lib/firebase/firestore';
import { User } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handleReportMatchAction, reportMatchSchema } from '@/lib/actions';

export default function ReportMatchPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { sport } = useSport();
  const [friends, setFriends] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingFriends, setIsFetchingFriends] = useState(true);

  useEffect(() => {
    if (user) {
      getFriends(user.uid).then(data => {
        setFriends(data);
        setIsFetchingFriends(false);
      });
    }
  }, [user]);

  const form = useForm<z.infer<typeof reportMatchSchema>>({
    resolver: zodResolver(reportMatchSchema),
    defaultValues: {
      matchType: 'Singles',
      myScore: 0,
      opponentScore: 0,
    },
  });
  
  const matchType = form.watch('matchType');

  async function onSubmit(values: z.infer<typeof reportMatchSchema>) {
    if (!user) return;
    setIsLoading(true);

    try {
        await handleReportMatchAction(values, sport, user);
        toast({ title: "Success", description: "Match reported and ranks updated!" });
        router.push('/dashboard');
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Failed to Report Match',
            description: error.message || 'An unexpected error occurred.',
        });
    } finally {
        setIsLoading(false);
    }
  }

  if (!user || isFetchingFriends) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8 flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const availablePartners = friends.filter(f => f.uid !== form.watch('opponent1') && f.uid !== form.watch('opponent2'));
  const availableOpponent1 = friends.filter(f => f.uid !== form.watch('partner'));
  const availableOpponent2 = friends.filter(f => f.uid !== form.watch('opponent1') && f.uid !== form.watch('partner'));

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Report a Match"
        description={`Report your recent ${sport} match to update your RacktRank.`}
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader><CardTitle>Match Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="matchType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Match Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue('partner', undefined);
                            form.setValue('opponent2', undefined);
                        }}
                        defaultValue={field.value}
                        className="flex items-center space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl><RadioGroupItem value="Singles" /></FormControl>
                          <FormLabel className="font-normal">Singles</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl><RadioGroupItem value="Doubles" /></FormControl>
                          <FormLabel className="font-normal">Doubles</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4 rounded-lg border p-4">
                      <h3 className="font-semibold">Team 1 (Your Team)</h3>
                      <p className='font-medium text-sm'>{user.name}</p>
                      {matchType === 'Doubles' && (
                          <FormField control={form.control} name="partner" render={({ field }) => (
                              <FormItem><FormLabel>Partner</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Partner" /></SelectTrigger></FormControl><SelectContent>{availablePartners.map(f => <SelectItem key={f.uid} value={f.uid}>{f.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                          )} />
                      )}
                  </div>
                   <div className="space-y-4 rounded-lg border p-4">
                      <h3 className="font-semibold">Team 2 (Opponents)</h3>
                      <FormField control={form.control} name="opponent1" render={({ field }) => (
                          <FormItem><FormLabel>Opponent 1</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Opponent" /></SelectTrigger></FormControl><SelectContent>{availableOpponent1.map(f => <SelectItem key={f.uid} value={f.uid}>{f.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                      )} />
                      {matchType === 'Doubles' && (
                          <FormField control={form.control} name="opponent2" render={({ field }) => (
                              <FormItem><FormLabel>Opponent 2</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select Opponent" /></SelectTrigger></FormControl><SelectContent>{availableOpponent2.map(f => <SelectItem key={f.uid} value={f.uid}>{f.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                          )} />
                      )}
                  </div>
              </div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader><CardTitle>Final Score</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex items-center gap-4">
                    <FormField control={form.control} name="myScore" render={({ field }) => (<FormItem className='flex-1'><FormLabel>Your Team's Score</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <span className="text-xl font-bold mt-8">-</span>
                    <FormField control={form.control} name="opponentScore" render={({ field }) => (<FormItem className='flex-1'><FormLabel>Opponent's Score</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                 </div>
            </CardContent>
          </Card>
          <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Match
          </Button>
        </form>
      </Form>
    </div>
  );
}
