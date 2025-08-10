'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { getFriendsAction } from '@/lib/actions';
import { useAuth } from '@/hooks/use-auth';

export interface FriendOption {
  uid: string;
  displayName: string;
  handle: string;
  photoURL?: string | null;
}

interface FriendComboboxProps {
  value?: string;
  onChange: (uid: string) => void;
}

export function FriendCombobox({ value, onChange }: FriendComboboxProps) {
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [friends, setFriends] = React.useState<FriendOption[]>([]);

  React.useEffect(() => {
    if (!user) return;
    getFriendsAction(user.uid).then((list) => {
      const formatted = list.map((u) => ({
        uid: u.uid,
        displayName: u.username,
        handle: u.username,
        photoURL: u.avatarUrl || null,
      }));
      setFriends(formatted);
    });
  }, [user]);

  const selected = friends.find((f) => f.uid === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selected ? selected.displayName : 'Select friend'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
        <Command>
          <CommandInput placeholder="Search friend" />
          <CommandList>
            <CommandEmpty>No friends found.</CommandEmpty>
            <CommandGroup>
              {friends.map((friend) => (
                <CommandItem
                  key={friend.uid}
                  onSelect={() => {
                    onChange(friend.uid);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === friend.uid ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {friend.displayName}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default FriendCombobox;
