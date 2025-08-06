'use client';

import { type User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSport } from '../providers/sport-provider';

interface UserAvatarProps {
  user?: User | null;
  className?: string;
}

// Dummy mapping, replace with real data
const achievementIcons: { [key: string]: React.ComponentType<{ className?: string }> } = {
  'top-100': Flame,
};

const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  const { sport } = useSport();
  const flexedAchievementId = user?.sports?.[sport]?.flexedAchievementId;
  const FlexIcon = flexedAchievementId ? achievementIcons[flexedAchievementId] : null;

  return (
    <div className={cn('relative', className)}>
      <Avatar className="h-full w-full bg-muted">
        <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.username ?? 'User avatar'} />
        <AvatarFallback>{getInitials(user?.username)}</AvatarFallback>
      </Avatar>
      {FlexIcon && (
        <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-accent">
          <FlexIcon className="h-3 w-3 text-accent-foreground" />
        </div>
      )}
    </div>
  );
}
