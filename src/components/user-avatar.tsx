import { type User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  user?: User | null;
  className?: string;
}

// Dummy mapping, replace with real data
const achievementIcons: { [key: string]: React.ComponentType<{ className?: string }> } = {
  'top-100': Flame,
};

export function UserAvatar({ user, className }: UserAvatarProps) {
  const flexedAchievementId = user?.sports?.Tennis?.flexedAchievementId;
  const FlexIcon = flexedAchievementId ? achievementIcons[flexedAchievementId] : null;

  return (
    <div className={cn('relative', className)}>
      <Avatar className="h-full w-full">
        <AvatarImage src={user?.avatar} alt={user?.name} />
        <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
      </Avatar>
      {FlexIcon && (
        <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-accent">
          <FlexIcon className="h-3 w-3 text-accent-foreground" />
        </div>
      )}
    </div>
  );
}
