'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { getAllUsers } from '@/lib/firebase/firestore';
import { User, reportMatchSchema } from '@/lib/types';
import { Loader2, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handleReportMatchAction } from '@/lib/actions';

export default function ReportMatchPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { sport } = useSport();
  const [availablePlayers, setAvailablePlayers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingPlayers, setIsFetchingPlayers] = useState(true);

  useEffect(() => {
    if (user) {
      getAllUsers(user.uid).then(data => {
        setAvailablePlayers(data);
        setIsFetchingPlayers(false);
      });
    }
  }, [user]);

  const form = useForm<z.infer<typeof reportMatchSchema>>({
    resolver: zodResolver(reportMatchSchema),
    defaultValues: {
      matchType: 'Singles',
      sets: [{ my: 0, opponent: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'sets',
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

  if (!user || isFetchingPlayers) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8 flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const availablePartners = availablePlayers.filter(f => f.uid !== form.watch('opponent1') && f.uid !== form.watch('opponent2'));
  const availableOpponent1 = availablePlayers.filter(f => f.uid !== form.watch('partner'));
  const availableOpponent2 = availablePlayers.filter(f => f.uid !== form.watch('opponent1') && f.uid !== form.watch('partner'));

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
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Final Score</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ my: 0, opponent: 0 })}>
                    <Plus className="mr-2 h-4 w-4" /> Add Set
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2 sm:gap-4">
                        <FormLabel className="min-w-[50px] text-sm text-muted-foreground">Set {index + 1}</FormLabel>
                        <FormField control={form.control} name={`sets.${index}.my`} render={({ field }) => (<FormItem className='flex-1'><FormControl><Input type="number" placeholder="Your Score" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <span className="text-lg font-medium text-muted-foreground">-</span>
                        <FormField control={form.control} name={`sets.${index}.opponent`} render={({ field }) => (<FormItem className='flex-1'><FormControl><Input type="number" placeholder="Opponent Score" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                            <X className="h-4 w-4" />
                            <span className="sr-only">Remove Set</span>
                        </Button>
                    </div>
                ))}
                <FormField control={form.control} name="sets" render={({ fieldState }) => <FormMessage>{fieldState.error?.message || (fieldState.error as any)?.root?.message}</FormMessage>} />
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
