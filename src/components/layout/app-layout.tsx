
'use client';

import { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Search, Settings, ChevronDown, Check, User as UserIcon } from 'lucide-react';
import { signOut } from 'firebase/auth';
import Image from 'next/image';

import { type User } from '@/lib/types';
import { NAV_ITEMS_MAIN, NAV_ITEMS_MOBILE } from '@/lib/constants';
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
  useSidebar,
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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { useSport } from '../providers/sport-provider';
import { SPORTS } from '@/lib/constants';

interface AppLayoutProps {
  children: ReactNode;
  user: User;
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
            <Image src="/my-logo2.svg" alt="Rackt Logo" width={28} height={28} />
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
                <span>Sport</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={sport} onValueChange={(value) => setSport(value as any)}>
                    {SPORTS.map((s) => (
                      <DropdownMenuRadioItem key={s} value={s}>
                        {s}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
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
        <main className="flex-1 pb-16 md:pb-0">
          {children}
        </main>
      </SidebarInset>
      <BottomNav />
    </SidebarProvider>
  );
}
