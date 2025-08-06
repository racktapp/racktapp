'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from '@/components/ui/switch';

import { useAuth } from '@/hooks/use-auth';
import { getAllUsers } from '@/lib/firebase/firestore';
import { User, Sport, reportMatchSchema } from '@/lib/types';
import { SPORTS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { handleReportMatchAction } from '@/lib/actions';
import { cn } from "@/lib/utils";
import { useSport } from '@/components/providers/sport-provider';
import { LoadingSpinner } from '@/components/ui/loading-spinner';


export default function ReportMatchPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { sport } = useSport();
  const [availablePlayers, setAvailablePlayers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingPlayers, setIsFetchingPlayers] = useState(true);

  useEffect(() => {
    async function fetchPlayers() {
        if (user) {
            setIsFetchingPlayers(true);
            const data = await getAllUsers(user.uid);
            setAvailablePlayers(data);
            setIsFetchingPlayers(false);
        }
    }
    fetchPlayers();
  }, [user]);

  const form = useForm<z.infer<typeof reportMatchSchema>>({
    resolver: zodResolver(reportMatchSchema),
    defaultValues: {
      matchType: 'Singles',
      sport: sport,
      isRanked: true,
      date: new Date(),
      score: '',
    },
  });

  const matchType = form.watch('matchType');
  const opponent1Id = form.watch('opponent1');
  const partnerId = form.watch('partner');
  const opponent2Id = form.watch('opponent2');

  const selectedPlayers = useMemo(() => {
    if (isFetchingPlayers || !user) return [];
    const players: User[] = [user].filter(Boolean);
    if (opponent1Id) {
      const p = availablePlayers.find(p => p.uid === opponent1Id);
      if (p) players.push(p);
    }
    if (matchType === 'Doubles') {
      if (partnerId) {
        const p = availablePlayers.find(p => p.uid === partnerId);
        if (p) players.push(p);
      }
      if (opponent2Id) {
        const p = availablePlayers.find(p => p.uid === opponent2Id);
        if (p) players.push(p);
      }
    }
    return players;
  }, [user, availablePlayers, matchType, opponent1Id, partnerId, opponent2Id, isFetchingPlayers]);


  async function onSubmit(values: z.infer<typeof reportMatchSchema>) {
    if (!user) return;
    setIsLoading(true);

    try {
        await handleReportMatchAction(values, user);
        toast({ title: "Match Submitted", description: "The result is pending confirmation from other players." });
        router.push('/match-history');
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

  const availablePartners = availablePlayers.filter(p => p.uid !== opponent1Id && p.uid !== opponent2Id);
  const availableOpponent1 = availablePlayers.filter(p => p.uid !== partnerId);
  const availableOpponent2 = availablePlayers.filter(p => p.uid !== opponent1Id && p.uid !== partnerId);

  if (!user || isFetchingPlayers) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8 flex h-full w-full items-center justify-center">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Report Match Result"
        description="Enter the details of your completed match. This will update stats for all players."
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-lg mx-auto">
          <Card>
            <CardContent className="p-6 space-y-6">
              <FormField
                control={form.control}
                name="matchType"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                        <Tabs
                            defaultValue={field.value}
                            onValueChange={(value) => {
                                field.onChange(value);
                                form.resetField('partner');
                                form.resetField('opponent2');
                                form.resetField('winnerId');
                            }}
                        >
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="Singles">Singles</TabsTrigger>
                                <TabsTrigger value="Doubles">Doubles</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="sport" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sport</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value as Sport)} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select sport" /></SelectTrigger></FormControl>
                        <SelectContent>{SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="opponent1" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opponent</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent>{availableOpponent1.map(p => <SelectItem key={p.uid} value={p.uid}>{p.username}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
            </div>

            {matchType === 'Doubles' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="partner" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Partner</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select partner" /></SelectTrigger></FormControl>
                            <SelectContent>{availablePartners.map(p => <SelectItem key={p.uid} value={p.uid}>{p.username}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="opponent2" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Second Opponent</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select opponent" /></SelectTrigger></FormControl>
                            <SelectContent>{availableOpponent2.map(p => <SelectItem key={p.uid} value={p.uid}>{p.username}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                </div>
            )}
            
            <FormField control={form.control} name="score" render={({ field }) => (
              <FormItem>
                <FormLabel>Score (e.g., 6-4, 6-3)</FormLabel>
                <FormControl><Input placeholder="Enter final score" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="winnerId" render={({ field }) => (
              <FormItem>
                <FormLabel>Winner</FormLabel>
                 <Select onValueChange={field.onChange} value={field.value} disabled={selectedPlayers.length < (matchType === 'Singles' ? 2 : 4)}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select winner" /></SelectTrigger></FormControl>
                    <SelectContent>
                        {selectedPlayers.map(p => <SelectItem key={p.uid} value={p.uid}>{p.username}</SelectItem>)}
                    </SelectContent>
                </Select>
                <FormDescription>Select one player from the winning team.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

             <FormField
                control={form.control}
                name="isRanked"
                render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-muted/10 p-4">
                    <div className="space-y-0.5">
                    <FormLabel>
                        Ranked Match
                    </FormLabel>
                    <FormDescription>
                        Will this match affect players' RacktRank?
                    </FormDescription>
                    </div>
                    <FormControl>
                    <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                    />
                    </FormControl>
                </FormItem>
                )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of Match</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            </CardContent>
          </Card>
          
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
            Submit for Confirmation
          </Button>
        </form>
      </Form>
    </div>
  );
}
