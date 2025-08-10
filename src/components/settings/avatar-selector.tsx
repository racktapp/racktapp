
'use client';

import { useState } from "react";
import Image from "next/image";
import { User, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { STOCK_AVATARS } from "@/lib/constants";
import { User as AppUser } from "@/lib/types";
import { updateUserAvatarAction } from "@/lib/actions";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type AvatarSelectorProps = {
  user: AppUser;
};

export function AvatarSelector({ user }: AvatarSelectorProps) {
  const { reloadUser } = useAuth();
  const { toast } = useToast();
  
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSelect = async (avatarUrl: string) => {
    if (isSaving || user.avatarUrl === avatarUrl) return;

    setSelectedAvatar(avatarUrl);
    setIsSaving(true);
    
    try {
      const result = await updateUserAvatarAction(user.uid, avatarUrl);
      if (result.success) {
        toast({ title: "Avatar Updated!", description: "Your new avatar has been saved." });
        await reloadUser();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not update your avatar.", variant: "destructive" });
      setSelectedAvatar(null); // Reset on error
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><User /> Select Your Avatar</CardTitle>
        <CardDescription>Choose a default avatar for your profile. Changes are saved automatically.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
          {STOCK_AVATARS.map((avatar) => {
            const isSelected = user.avatarUrl === avatar.url;
            const isBeingProcessed = isSaving && selectedAvatar === avatar.url;

            return (
              <button
                key={avatar.url}
                type="button"
                onClick={() => handleSelect(avatar.url)}
                disabled={isSaving}
                className={cn(
                  "relative aspect-square rounded-full border-4 transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  isSelected ? "border-primary" : "border-transparent hover:border-muted-foreground/50",
                  isSaving && !isBeingProcessed ? "opacity-50 cursor-not-allowed" : ""
                )}
              >
                <Image src={avatar.url} alt="Stock Avatar" width={100} height={100} className="rounded-full object-cover w-full h-full" unoptimized />
                {isBeingProcessed && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
                    <LoadingSpinner />
                  </div>
                )}
                {isSelected && !isBeingProcessed && (
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground border-2 border-background">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
