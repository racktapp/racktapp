
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Check, ChevronsUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';
import { type User, profileSettingsSchema } from '@/lib/types';
import { SPORTS } from '@/lib/constants';
import { updateUserProfileAction } from '@/lib/actions';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface SettingsFormProps {
  user: User;
}

export function SettingsForm({ user }: SettingsFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof profileSettingsSchema>>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      name: user.name || '',
      username: user.username || '',
      preferredSports: user.preferredSports || [],
    },
  });

  async function onSubmit(values: z.infer<typeof profileSettingsSchema>) {
    setIsLoading(true);
    const result = await updateUserProfileAction(values, user.uid);
    if (result.success) {
      toast({ title: 'Success', description: result.message });
      router.refresh(); // Refresh the page to get the updated user data in the layout
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
    setIsLoading(false);
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your personal information and preferences.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                <Input placeholder="johndoe" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Used for your public profile URL.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="preferredSports"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Preferred Sports</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className={cn(
                                            "w-full justify-between",
                                            !field.value.length && "text-muted-foreground"
                                        )}
                                        >
                                        {field.value.length > 0 ? field.value.join(', ') : "Select sports"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search sports..." />
                                    <CommandEmpty>No sport found.</CommandEmpty>
                                    <CommandGroup>
                                    {SPORTS.map((sport) => (
                                        <CommandItem
                                            value={sport}
                                            key={sport}
                                            onSelect={() => {
                                                const currentValue = field.value;
                                                const newValue = currentValue.includes(sport)
                                                    ? currentValue.filter(s => s !== sport)
                                                    : [...currentValue, sport];
                                                form.setValue("preferredSports", newValue, { shouldValidate: true });
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                "mr-2 h-4 w-4",
                                                field.value.includes(sport) ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {sport}
                                        </CommandItem>
                                    ))}
                                    </CommandGroup>
                                </Command>
                                </PopoverContent>
                            </Popover>
                            <FormDescription>
                                Select your favorite sports.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Form>
        </CardContent>
    </Card>
  );
}
