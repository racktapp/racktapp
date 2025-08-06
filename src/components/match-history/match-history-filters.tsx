'use client';
import { User } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface MatchHistoryFiltersProps {
  friends: User[];
  opponentFilter: string;
  setOpponentFilter: (value: string) => void;
  className?: string;
}

export function MatchHistoryFilters({
  friends,
  opponentFilter,
  setOpponentFilter,
  className,
}: MatchHistoryFiltersProps) {
  return (
    <div className={cn('flex flex-col md:flex-row gap-4', className)}>
      <Select value={opponentFilter} onValueChange={setOpponentFilter}>
        <SelectTrigger className="w-full md:w-[240px]">
          <SelectValue placeholder="Filter by opponent" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Opponents</SelectItem>
          {friends.map(friend => (
            <SelectItem key={friend.uid} value={friend.uid}>
              @{friend.username}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}