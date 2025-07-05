
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
import { Save, Image as ImageIcon, UploadCloud, Loader2, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import React, { useState, useRef, useEffect } from "react";
import NextImage from "next/image";

const profileFormSchema = z.object({
  name: z.string().min(1, { message: "Name cannot be empty." }).max(50),
});

export function SettingsForm() {
  const { toast } = useToast();
  const { user, updateUserName, updateUserProfileImage } = useAuth();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.avatarUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({ name: user.name || "" });
      if (!selectedFile) {
        setPreviewUrl(user.avatarUrl || null);
      }
    }
  }, [user, form, selectedFile]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ variant: 'destructive', title: 'File too large', description: 'Please upload an image smaller than 5MB.' });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!user) {
      toast({ title: "Not Logged In", description: "Please log in.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    
    try {
      const promises = [];
      if (values.name !== user.name) {
        promises.push(updateUserName(user.uid, values.name));
      }
      if (selectedFile) {
        promises.push(updateUserProfileImage(user.uid, selectedFile));
      }

      if (promises.length > 0) {
        await Promise.all(promises);
        toast({ title: "Profile Updated", description: "Your changes have been saved." });
        setSelectedFile(null);
      } else {
        toast({ title: "No Changes", description: "You haven't made any changes to save." });
      }

    } catch (error) {
      console.error("Error saving profile info", error);
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
            <CardDescription>Update your public name and avatar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
            <div>
              <FormLabel>Profile Picture</FormLabel>
              <div className="mt-1 flex flex-col items-center gap-3">
                {previewUrl ? (
                  <NextImage src={previewUrl} alt="Avatar preview" width={128} height={128} className="h-32 w-32 rounded-full border object-cover" data-ai-hint="user avatar" />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-full border bg-muted">
                    <ImageIcon className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  ref={fileInputRef}
                />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <UploadCloud className="mr-2 h-4 w-4" /> Choose File
                </Button>
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
