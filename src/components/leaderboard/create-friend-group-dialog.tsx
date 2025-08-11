'use client';
import { ReactNode, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Check } from 'lucide-react';

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
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
  } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { type User, createFriendGroupSchema } from '@/lib/types';
import { createFriendGroupAction } from '@/lib/actions';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/ui/loading-spinner';


interface CreateFriendGroupDialogProps {
  user: User;
  friends: User[];
  children: ReactNode;
  onGroupCreated: () => void;
}

export function CreateFriendGroupDialog({ user, friends, children, onGroupCreated }: CreateFriendGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof createFriendGroupSchema>>({
    resolver: zodResolver(createFriendGroupSchema),
    defaultValues: {
      name: '',
      memberIds: [],
    },
  });

  async function onSubmit(values: z.infer<typeof createFriendGroupSchema>) {
    setIsLoading(true);
    const result = await createFriendGroupAction(values, user.uid);
    if (result.success) {
      toast({ title: 'Group Created!', description: 'Your new leaderboard is ready.' });
      onGroupCreated();
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
          <DialogTitle>Create Friend Group</DialogTitle>
          <DialogDescription>Create a private leaderboard for you and your friends.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Group Name</FormLabel><FormControl><Input placeholder="e.g. Weekend Warriors" {...field} /></FormControl><FormMessage /></FormItem>)} />
             <FormField
                control={form.control}
                name="memberIds"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Friends</FormLabel>
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
                            <Command>
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
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
                )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
                Create Group
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
