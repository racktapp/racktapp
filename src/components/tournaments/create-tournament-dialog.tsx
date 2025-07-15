
'use client';
import { ReactNode, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Check, X, Command } from 'lucide-react';

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
import {
    Command as CommandPrimitive,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
  } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { SPORTS } from '@/lib/constants';
import { type User, createTournamentSchema } from '@/lib/types';
import { createTournamentAction, getFriendsAction } from '@/lib/actions';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';


interface CreateTournamentDialogProps {
  user: User;
  children: ReactNode;
  onTournamentCreated: () => void;
}

export function CreateTournamentDialog({ user, children, onTournamentCreated }: CreateTournamentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [friends, setFriends] = useState<User[]>([]);
  const [isFetchingFriends, setIsFetchingFriends] = useState(true);

  const form = useForm<z.infer<typeof createTournamentSchema>>({
    resolver: zodResolver(createTournamentSchema),
    defaultValues: {
      name: '',
      sport: 'Tennis',
      participantIds: [],
    },
  });

  useEffect(() => {
    async function fetchFriends() {
      if (user) {
        setIsFetchingFriends(true);
        const friendsData = await getFriendsAction(user.uid);
        setFriends(friendsData);
        setIsFetchingFriends(false);
      }
    }
    fetchFriends();
  }, [user]);

  async function onSubmit(values: z.infer<typeof createTournamentSchema>) {
    setIsLoading(true);
    const result = await createTournamentAction(values, user);
    if (result.success) {
      toast({ title: 'Tournament Created!', description: 'The bracket has been generated.' });
      onTournamentCreated();
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Tournament</DialogTitle>
          <DialogDescription>Set up a new single-elimination tournament.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Tournament Name</FormLabel><FormControl><Input placeholder="e.g. Summer Showdown" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField
              control={form.control}
              name="sport"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sport</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a sport" /></SelectTrigger></FormControl>
                    <SelectContent>{SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="participantIds"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Participants</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                            <Button variant="outline" className="w-full justify-start font-normal h-auto">
                                <UserPlus className="mr-2 h-4 w-4" />
                                <div className='flex flex-wrap gap-1'>
                                    {field.value.length > 0 ? (
                                        friends
                                        .filter((friend) => field.value.includes(friend.uid))
                                        .map((friend) => (
                                            <Badge
                                                key={friend.uid}
                                                variant="secondary"
                                                className="rounded-sm"
                                            >
                                                @{friend.username}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span>Select friends</span>
                                    )}
                                </div>
                            </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                            <CommandPrimitive>
                                <CommandInput placeholder="Search friends..." />
                                <CommandList>
                                    <CommandEmpty>No results found.</CommandEmpty>
                                    <CommandGroup>
                                    {friends.map((friend) => {
                                        const isSelected = field.value.includes(friend.uid);
                                        return (
                                        <CommandItem
                                            key={friend.uid}
                                            onSelect={() => {
                                                const newValue = isSelected
                                                    ? field.value.filter((id) => id !== friend.uid)
                                                    : [...field.value, friend.uid];
                                                field.onChange(newValue);
                                            }}
                                        >
                                            <div
                                            className={cn(
                                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                isSelected
                                                ? "bg-primary text-primary-foreground"
                                                : "opacity-50 [&_svg]:invisible"
                                            )}
                                            >
                                                <Check className={cn("h-4 w-4")} />
                                            </div>
                                            <span>@{friend.username}</span>
                                        </CommandItem>
                                        );
                                    })}
                                    </CommandGroup>
                                </CommandList>
                            </CommandPrimitive>
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
                )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isLoading || isFetchingFriends}>
                {isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
                Create Tournament
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
