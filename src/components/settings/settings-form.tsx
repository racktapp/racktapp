
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import React, { useState, useEffect } from "react";
import { User as AppUser, profileSettingsSchema } from "@/lib/types";
import { SPORTS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { updateUserProfileAction } from "@/lib/actions";
import { cn } from "@/lib/utils";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase/config";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Save, Loader2, User as UserIcon, Check, ChevronsUpDown } from "lucide-react";

type SettingsFormProps = {
  user: AppUser;
};

export function SettingsForm({ user }: SettingsFormProps) {
  const { toast } = useToast();
  const { reloadUser } = useAuth();
  
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof profileSettingsSchema>>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      username: user?.username || "",
      preferredSports: user?.preferredSports || [],
    },
  });

  useEffect(() => {
    form.reset({
      username: user.username || "",
      preferredSports: user.preferredSports || [],
    });
  }, [user, form]);

  async function onSubmit(values: z.infer<typeof profileSettingsSchema>) {
    setIsSaving(true);
    
    try {
      // Update the client-side auth object first for immediate UI feedback.
      if (auth.currentUser && values.username !== auth.currentUser.displayName) {
        await updateProfile(auth.currentUser, { displayName: values.username });
      }

      // Then, call the server action to persist the change in Firestore.
      const result = await updateUserProfileAction(values, user.uid);
      
      if (result.success) {
        toast({ title: "Profile Updated", description: "Your changes have been saved." });
        await reloadUser(); // This will re-fetch the user data and update the context.
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({ title: "Error Saving Profile", description: error.message || "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserIcon /> Profile Information</CardTitle>
            <CardDescription>This information is visible to other players on your profile.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="your_username" {...field} />
                      </FormControl>
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
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <span className="truncate">
                           {field.value.length > 0
                            ? field.value.join(", ")
                            : "Select your preferred sports"}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Search sports..." />
                        <CommandEmpty>No sport found.</CommandEmpty>
                        <CommandGroup>
                            <CommandList>
                          {SPORTS.map((sport) => (
                            <CommandItem
                              value={sport}
                              key={sport}
                              onSelect={() => {
                                const currentSports = field.value || [];
                                const newSports = currentSports.includes(sport)
                                  ? currentSports.filter((s) => s !== sport)
                                  : [...currentSports, sport];
                                form.setValue("preferredSports", newSports);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value?.includes(sport)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {sport}
                            </CommandItem>
                          ))}
                          </CommandList>
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSaving || !form.formState.isDirty}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
