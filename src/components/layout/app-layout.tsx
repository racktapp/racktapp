
'use client';

import { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, LogOut, Settings, User as UserIcon } from 'lucide-react';
import { signOut } from 'firebase/auth';
import Image from 'next/image';

import { type User } from '@/lib/types';
import { NAV_ITEMS_MAIN, NAV_ITEMS_MOBILE, SPORTS, SPORT_ICONS } from '@/lib/constants';
import { auth } from '@/lib/firebase/config';
import { useUnreadChats } from '@/hooks/use-unread-chats';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSport } from '../providers/sport-provider';
import { Logo } from '../ui/logo';

interface AppLayoutProps {
  children: ReactNode;
  user: User;
}

const MobileHeader = () => {
    const { sport, setSport } = useSport();

    return (
        <div className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:hidden">
            <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold text-primary">
                <Logo />
            </Link>
            <div className="flex-1" />
            <Select value={sport} onValueChange={(value) => setSport(value as any)}>
                <SelectTrigger className="h-9 w-auto justify-start gap-2 border-muted-foreground/50 px-2">
                    <Image src={SPORT_ICONS[sport]} alt={sport} width={20} height={20} className="rounded-sm" unoptimized />
                    <span className="flex-1 text-left"><SelectValue placeholder="Select sport" /></span>
                </SelectTrigger>
                <SelectContent>
                    {SPORTS.map((s) => (
                    <SelectItem key={s} value={s}>
                        <div className="flex items-center gap-2">
                            <Image src={SPORT_ICONS[s]} alt={s} width={20} height={20} className="rounded-sm" unoptimized />
                            <span>{s}</span>
                        </div>
                    </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}

const AppSidebar = ({ user }: { user: User }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { sport, setSport } = useSport();
  const hasUnreadChats = useUnreadChats();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold text-primary">
            <Logo />
            <span className="font-headline group-data-[collapsible=icon]:hidden">Rackt</span>
          </Link>
          <div className="group-data-[collapsible=icon]:hidden">
            <SidebarTrigger />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {NAV_ITEMS_MAIN.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                tooltip={item.label}
                className="relative"
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                  {item.href === '/chat' && hasUnreadChats && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-orange-500 group-data-[collapsible=icon]:right-1.5" />
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto w-full justify-start p-2 text-left">
              <div className="flex w-full items-center justify-start gap-3">
                <UserAvatar user={user} className="h-10 w-10" />
                <div className="flex flex-col items-start group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-semibold">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mb-2" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <div className="flex items-center gap-2">
                    <Image src={SPORT_ICONS[sport]} alt={sport} width={16} height={16} unoptimized/>
                    <span>Sport</span>
                </div>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  {SPORTS.map((s) => (
                    <DropdownMenuItem key={s} onSelect={() => setSport(s as any)}>
                        <div className="flex items-center gap-2">
                            <Image src={SPORT_ICONS[s]} alt={s} width={16} height={16} unoptimized />
                            <span>{s}</span>
                        </div>
                        {sport === s && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                    ))}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')}>
              <UserIcon size={16} className="mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings size={16} className="mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut size={16} className="mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

const BottomNav = () => {
    const pathname = usePathname();
    const hasUnreadChats = useUnreadChats();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm md:hidden">
            <div className="grid h-16 grid-cols-5">
                {NAV_ITEMS_MOBILE.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`relative flex flex-col items-center justify-center gap-1 text-xs ${pathname.startsWith(item.href) ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                        {item.href === '/chat' && hasUnreadChats && (
                          <span className="absolute top-2 right-[calc(50%-1.25rem)] h-2 w-2 rounded-full bg-primary" />
                        )}
                    </Link>
                ))}
            </div>
        </div>
    );
};


export function AppLayout({ children, user }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <MobileHeader />
        <main className="flex-1 pb-16 md:pb-0">
          {children}
        </main>
      </SidebarInset>
      <BottomNav />
    </SidebarProvider>
  );
}
