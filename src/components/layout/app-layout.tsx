
'use client';

import { ReactNode, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, LogOut, Settings, User as UserIcon, Menu, Sun, Moon, Home, Swords, Trophy, Map, SlidersHorizontal } from 'lucide-react';
import { signOut } from 'firebase/auth';
import Image from 'next/image';
import { useTheme } from 'next-themes';

import { type User } from '@/lib/types';
import { SPORTS, SPORT_ICONS } from '@/lib/constants';
import { NAV_ITEMS_MAIN, NAV_ITEMS_MOBILE_MAIN, NAV_ITEMS_MOBILE_MORE } from '@/lib/navigation';
import { auth } from '@/lib/firebase/config';
import { useUnreadChats } from '@/hooks/use-unread-chats';
import { useAuth } from '@/hooks/use-auth';

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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useSport } from '../providers/sport-provider';
import { Logo } from '../ui/logo';
import { NotificationBell } from './notification-bell';
import { OnboardingTour } from '../onboarding-tour';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';

const MobileHeader = () => {
    const { sport, setSport } = useSport();

    return (
        <div className="flex h-16 items-center gap-4 border-b bg-background px-4 md:hidden">
            <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold text-primary">
                <Logo />
            </Link>
            <div className="flex-1" />
            <NotificationBell />
            <Select value={sport} onValueChange={(value) => setSport(value as any)}>
                <SelectTrigger id="tour-step-sport-selector" className="h-9 w-auto justify-start gap-2 border-muted-foreground/50 px-2">
                    <Image src={SPORT_ICONS[sport]} alt={sport} width={20} height={20} className="rounded-sm" unoptimized />
                    <span className="flex-1 text-left">{sport}</span>
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
  const { setTheme } = useTheme();

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
          <div className="flex items-center gap-1 group-data-[collapsible=icon]:hidden">
             <NotificationBell />
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
                id={
                    item.href === '/challenges' ? 'tour-step-challenges' :
                    item.href === '/coach' ? 'tour-step-ai-coach' : undefined
                }
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                  {item.href === '/chat' && hasUnreadChats && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
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
            <Button id="tour-step-profile-menu" variant="ghost" className="h-auto w-full justify-start p-2 text-left">
              <div className="flex w-full items-center justify-start gap-3">
                <UserAvatar user={user} className="h-10 w-10" />
                <div className="flex flex-col items-start group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-semibold truncate">@{user.username}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mb-2" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">@{user.username}</p>
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
             <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="ml-2">Theme</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => user && router.push(`/profile?id=${user.uid}`)}>
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
    const router = useRouter();
    const hasUnreadChats = useUnreadChats();
    const { user } = useAuth();

    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

    const handleMoreMenuLinkClick = (href: string) => {
        setIsMoreMenuOpen(false);
        const finalHref = href === '/profile' && user ? `/profile?id=${user.uid}` : href;
        router.push(finalHref);
    };
    
    const MoreMenuSection = ({ title, items }: { title: string, items: typeof NAV_ITEMS_MOBILE_MORE }) => (
        <div>
            <h4 className="px-3 py-2 text-sm font-semibold text-muted-foreground">{title}</h4>
            {items.map((item) => (
                <button
                    key={item.href}
                    onClick={() => handleMoreMenuLinkClick(item.href)}
                    className="w-full relative flex items-center gap-4 rounded-md p-3 text-left text-foreground transition-colors hover:bg-muted"
                >
                    <item.icon className="h-6 w-6 text-muted-foreground" />
                    <span className="text-base font-medium">{item.label}</span>
                    {item.href === '/chat' && hasUnreadChats && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-primary" />
                    )}
                </button>
            ))}
        </div>
    );

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm md:hidden">
            <div className="grid h-16 grid-cols-5">
                {NAV_ITEMS_MOBILE_MAIN.map((item) => {
                    const href = item.href === '/profile' && user ? `/profile?id=${user.uid}` : item.href;
                    return (
                        <Link
                            key={item.href}
                            href={href}
                            className={`flex flex-col items-center justify-center gap-1 text-xs ${pathname.startsWith(item.href) ? 'text-primary' : 'text-muted-foreground'}`}
                        >
                            <item.icon className="h-5 w-5" />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
                
                <Sheet open={isMoreMenuOpen} onOpenChange={setIsMoreMenuOpen}>
                    <SheetTrigger asChild>
                        <button className="relative flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground">
                            <Menu className="h-5 w-5" />
                            <span>More</span>
                            {hasUnreadChats && (
                                <span className="absolute top-2 right-[calc(50%-1.25rem)] h-2 w-2 rounded-full bg-primary" />
                            )}
                        </button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-auto max-h-[80vh] flex flex-col p-0 rounded-t-lg">
                        <SheetHeader className="p-4 border-b text-left">
                            <SheetTitle>More Options</SheetTitle>
                        </SheetHeader>
                        <div className="flex-1 overflow-y-auto">
                           <MoreMenuSection title="Social" items={NAV_ITEMS_MOBILE_MORE.slice(0, 2)} />
                           <Separator />
                           <MoreMenuSection title="Performance" items={NAV_ITEMS_MOBILE_MORE.slice(2, 5)} />
                           <Separator />
                           <MoreMenuSection title="AI Tools" items={NAV_ITEMS_MOBILE_MORE.slice(5, 7)} />
                           <Separator />
                           <MoreMenuSection title="Account" items={NAV_ITEMS_MOBILE_MORE.slice(7)} />
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    );
};

interface AppLayoutProps {
  children: ReactNode;
  user: User;
}

export function AppLayout({ children, user }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <MobileHeader />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
      </SidebarInset>
      <BottomNav />
      <OnboardingTour />
    </SidebarProvider>
  );
}
