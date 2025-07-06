

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import React, { useState, useEffect } from "react";
import { UserAvatar } from "../user-avatar";

const profileFormSchema = z.object({
  name: z.string().min(1, { message: "Name cannot be empty." }).max(50),
});

export function SettingsForm() {
  const { toast } = useToast();
  const { user, updateUserName } = useAuth();
  
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: user?.name || "" },
  });

  useEffect(() => {
    if (user) {
      form.reset({ name: user.name || "" });
    }
  }, [user, form]);

  async function onSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!user) {
      toast({ title: "Not Logged In", description: "Please log in.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    
    try {
      const nameChanged = values.name !== user.name;

      if (nameChanged) {
        await updateUserName(user.uid, values.name);
        toast({ title: "Profile Updated", description: "Your name has been saved." });
      } else {
        toast({ title: "No Changes", description: "You haven't made any changes to save." });
      }

    } catch (error) {
      // Errors are already toasted by the context functions
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="shadow-lg">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserIcon /> Profile Information</CardTitle>
            <CardDescription>Update your public profile information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <UserAvatar user={user} className="h-20 w-20" />
              <div className="flex-1">
                 <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Profile
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
