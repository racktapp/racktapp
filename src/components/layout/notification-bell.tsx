
'use client';
import { Bell, Gamepad2, Swords, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useNotifications } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '../ui/badge';

export function NotificationBell() {
    const { total, friendRequestCount, challengeCount, gameTurnCount, isLoading } = useNotifications();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {total > 0 && (
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                            {total > 9 ? '9+' : total}
                        </Badge>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isLoading ? (
                    <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
                ) : total === 0 ? (
                    <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
                ) : (
                    <>
                        {challengeCount > 0 && (
                            <Link href="/challenges">
                                <DropdownMenuItem>
                                    <Swords className="mr-2" />
                                    <span>{challengeCount} new challenge{challengeCount > 1 && 's'}</span>
                                </DropdownMenuItem>
                            </Link>
                        )}
                         {friendRequestCount > 0 && (
                            <Link href="/friends?tab=requests">
                                <DropdownMenuItem>
                                    <UserPlus className="mr-2" />
                                    <span>{friendRequestCount} new friend request{friendRequestCount > 1 && 's'}</span>
                                </DropdownMenuItem>
                            </Link>
                        )}
                         {gameTurnCount > 0 && (
                            <Link href="/games">
                                <DropdownMenuItem>
                                    <Gamepad2 className="mr-2" />
                                    <span>It's your turn in {gameTurnCount} game{gameTurnCount > 1 && 's'}</span>
                                </DropdownMenuItem>
                            </Link>
                        )}
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
