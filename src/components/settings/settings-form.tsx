

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
import { Save, Loader2, User as UserIcon, Palette, Sparkles, Paintbrush, PersonStanding } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import React, { useState, useEffect } from "react";
import { AvatarConfig, defaultAvatarConfig } from "@/lib/types";
import { HAIR_COLORS, HAIR_STYLES, SKIN_COLORS } from "@/lib/constants";
import { CustomAvatar } from "../custom-avatar";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";

const profileFormSchema = z.object({
  name: z.string().min(1, { message: "Name cannot be empty." }).max(50),
});

const ColorSwatch = ({ color, isSelected, onClick }: { color: string; isSelected: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
      isSelected ? "border-primary scale-110" : "border-transparent"
    )}
    style={{ backgroundColor: color }}
    aria-label={`Select color ${color}`}
  />
);

export function SettingsForm() {
  const { toast } = useToast();
  const { user, updateUserName, updateUserAvatarConfig } = useAuth();
  
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(user?.avatarConfig || defaultAvatarConfig);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: user?.name || "" },
  });

  useEffect(() => {
    if (user) {
      form.reset({ name: user.name || "" });
      setAvatarConfig(user.avatarConfig || defaultAvatarConfig);
    }
  }, [user, form]);

  const handleConfigChange = <K extends keyof AvatarConfig>(key: K, value: AvatarConfig[K]) => {
    setAvatarConfig(prev => ({ ...prev, [key]: value }));
  };

  async function onSubmit(values: z.infer<typeof profileFormSchema>) {
    if (!user) {
      toast({ title: "Not Logged In", description: "Please log in.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    
    try {
      const nameChanged = values.name !== user.name;
      const avatarChanged = JSON.stringify(avatarConfig) !== JSON.stringify(user.avatarConfig);

      const promises = [];
      if (nameChanged) {
        promises.push(updateUserName(user.uid, values.name));
      }
      if (avatarChanged) {
        promises.push(updateUserAvatarConfig(user.uid, avatarConfig));
      }

      if (promises.length > 0) {
        await Promise.all(promises);
        toast({ title: "Profile Updated", description: "Your changes have been saved." });
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
            <CardDescription>Update your public name and customize your avatar.</CardDescription>
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
            
            <Separator />
            
            <div>
              <FormLabel>Avatar Customization</FormLabel>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 flex justify-center items-center">
                    <div className="h-32 w-32 rounded-full border-4 border-muted p-1">
                        <CustomAvatar config={avatarConfig} />
                    </div>
                </div>
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2"><Palette className="h-4 w-4" /> Skin Tone</h4>
                    <div className="flex gap-2 flex-wrap">{SKIN_COLORS.map(color => <ColorSwatch key={color} color={color} isSelected={avatarConfig.skinColor === color} onClick={() => handleConfigChange('skinColor', color)} />)}</div>
                  </div>
                   <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2"><Sparkles className="h-4 w-4" /> Hair Style</h4>
                    <div className="flex gap-2 flex-wrap">{HAIR_STYLES.map(style => (
                        <Button key={style} type="button" variant={avatarConfig.hairStyle === style ? 'default' : 'outline'} onClick={() => handleConfigChange('hairStyle', style)}>{style.charAt(0).toUpperCase() + style.slice(1)}</Button>
                    ))}</div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2"><Paintbrush className="h-4 w-4" /> Hair Color</h4>
                    <div className="flex gap-2 flex-wrap">{HAIR_COLORS.map(color => <ColorSwatch key={color} color={color} isSelected={avatarConfig.hairColor === color} onClick={() => handleConfigChange('hairColor', color)} />)}</div>
                  </div>
                </div>
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
