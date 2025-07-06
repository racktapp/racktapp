
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
import { Save, Loader2, User as UserIcon, UploadCloud } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import React, { useState, useRef, useEffect } from "react";
import NextImage from "next/image";
import { UserAvatar } from "../user-avatar";
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '@/lib/firebase/config';
import { updateUserAvatarAction } from '@/lib/actions';
import { updateProfile } from 'firebase/auth';

const profileFormSchema = z.object({
  name: z.string().min(1, { message: "Name cannot be empty." }).max(50),
});

export function SettingsForm() {
  const { toast } = useToast();
  const { user, updateUserName, reloadUser } = useAuth();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: user?.name || "" },
  });

  useEffect(() => {
    if (user) {
      form.reset({ name: user.name || "" });
      if (user.avatarUrl && !previewUrl) {
        setPreviewUrl(user.avatarUrl);
      }
    }
  }, [user, form, previewUrl]);

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
    if (!user || !auth.currentUser) {
      toast({ title: "Not Logged In", description: "Please log in.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    
    try {
      const promises = [];

      // Name update
      if (values.name !== user.name) {
        promises.push(updateUserName(user.uid, values.name));
      }

      // Avatar update
      if (selectedFile) {
        const fileRef = storageRef(storage, `avatars/${user.uid}/${Date.now()}_${selectedFile.name}`);
        const uploadTask = uploadBytes(fileRef, selectedFile)
          .then(snapshot => getDownloadURL(snapshot.ref))
          .then(async (downloadURL) => {
            // Update Auth on client and Firestore via server action
            await updateProfile(auth.currentUser!, { photoURL: downloadURL });
            await updateUserAvatarAction(user.uid, downloadURL);
          });
        promises.push(uploadTask);
      }

      if (promises.length === 0) {
        toast({ title: "No changes", description: "You haven't made any changes to save."});
      } else {
        await Promise.all(promises);
        toast({ title: "Profile Updated", description: "Your changes have been saved successfully." });
        setSelectedFile(null); // Clear selected file after successful upload
        await reloadUser(); // Reload user data from firestore to get the new URL
        setPreviewUrl(null); // Clear preview to force re-fetch from user object
      }
    } catch (error: any) {
      console.error("Error saving profile info", error);
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
            <CardDescription>Update your public profile information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <UserAvatar user={user} className="h-20 w-20" />
                 <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  ref={fileInputRef}
                />
                <Button type="button" size="icon" variant="secondary" className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full" onClick={() => fileInputRef.current?.click()}>
                  <UploadCloud className="h-4 w-4" />
                </Button>
              </div>
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
             {previewUrl && selectedFile && (
                <div>
                  <FormLabel>New Avatar Preview</FormLabel>
                  <div className="mt-2 flex justify-center rounded-md border-2 border-dashed p-4">
                     <NextImage src={previewUrl} alt="Avatar preview" width={128} height={128} className="h-32 w-32 rounded-full border object-cover" data-ai-hint="user avatar" />
                  </div>
                </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
