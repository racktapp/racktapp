'use client';
import { User } from '@/lib/types';
import { DateRange } from 'react-day-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { cn } from '@/lib/utils';

interface MatchHistoryFiltersProps {
  friends: User[];
  opponentFilter: string;
  setOpponentFilter: (value: string) => void;
  dateFilter?: DateRange;
  setDateFilter: (value: DateRange | undefined) => void;
  className?: string;
}

export function MatchHistoryFilters({
  friends,
  opponentFilter,
  setOpponentFilter,
  dateFilter,
  setDateFilter,
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
              {friend.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <DatePickerWithRange date={dateFilter} setDate={setDateFilter} className="w-full md:w-auto" />
    </div>
  );
}
