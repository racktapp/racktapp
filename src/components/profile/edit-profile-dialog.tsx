
'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Camera, Upload, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type User } from '@/lib/types';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase/config';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';
import { UserAvatar } from '../user-avatar';

const STOCK_AVATARS = [
  { url: 'https://placehold.co/100x100.png', hint: 'gradient avatar' },
  { url: 'https://placehold.co/100x100.png', hint: 'abstract pattern' },
  { url: 'https://placehold.co/100x100.png', hint: 'dark mode pattern' },
];

interface EditProfileDialogProps {
  children: ReactNode;
  user: User;
}

export function EditProfileDialog({ children, user }: EditProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('upload');
  const [newAvatarUrl, setNewAvatarUrl] = useState<string | null>(null); // Can be a data URI or an HTTP URL
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // --- Camera state and handlers ---
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };
  
  const startCamera = async () => {
    if (isCameraActive) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setHasCameraPermission(true);
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      setHasCameraPermission(false);
    }
  };

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setNewAvatarUrl(dataUrl);
        stopCamera();
      }
    }
  };

  // --- File upload handler ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // --- Tab change handler ---
  const onTabChange = (value: string) => {
    setNewAvatarUrl(null); // Clear selection when changing tabs
    setActiveTab(value);
    if (value === 'camera') {
        startCamera();
    } else {
        stopCamera();
    }
  };

  // --- Dialog open/close handler ---
  const onOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      stopCamera();
      setNewAvatarUrl(null);
      setHasCameraPermission(null);
      setActiveTab('upload');
    }
  };
  
  // --- Main save handler ---
  const handleSave = async () => {
    if (!newAvatarUrl) {
      toast({ variant: 'destructive', title: 'No image selected' });
      return;
    }
    if (!auth.currentUser) {
      toast({ variant: 'destructive', title: 'Not Authenticated' });
      return;
    }

    setIsLoading(true);
    
    try {
      let finalAvatarUrl = newAvatarUrl;

      // This follows the 'Recommended Production Approach' from your guide.
      // If the avatar is a data URI (from upload or camera), upload it to Firebase Storage.
      if (newAvatarUrl.startsWith('data:image')) {
        const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}`);
        const snapshot = await uploadString(storageRef, newAvatarUrl, 'data_url');
        finalAvatarUrl = await getDownloadURL(snapshot.ref);
      }

      // 1. Update the user's profile in Firebase Authentication
      await updateProfile(auth.currentUser, { photoURL: finalAvatarUrl });
      
      // 2. Update the avatar field in the user's Firestore document
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, { avatar: finalAvatarUrl });

      toast({ title: 'Success', description: 'Profile picture updated! Changes may take a moment to appear.' });
      onOpenChange(false); // Close the dialog
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const previewSrc = newAvatarUrl || user.avatar;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile Picture</DialogTitle>
          <DialogDescription>
            Choose a new photo by uploading, using your camera, or selecting a stock avatar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center items-center h-40 bg-muted rounded-md my-4">
            {previewSrc ? (
                 <Image src={previewSrc} alt="Avatar preview" width={160} height={160} className="h-full w-auto object-contain rounded-md" />
            ) : (
                <UserAvatar user={user} className="h-24 w-24" />
            )}
        </div>

        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload"><Upload className="mr-2 h-4 w-4" /> Upload</TabsTrigger>
            <TabsTrigger value="camera"><Camera className="mr-2 h-4 w-4" /> Camera</TabsTrigger>
            <TabsTrigger value="stock"><ImageIcon className="mr-2 h-4 w-4" /> Stock</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <Input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} />
          </TabsContent>

          <TabsContent value="camera" className="mt-4">
            <div className="space-y-4">
              {!isCameraActive && newAvatarUrl && (
                 <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Photo Captured!</AlertTitle>
                    <AlertDescription>Click "Save Changes" to apply.</AlertDescription>
                </Alert>
              )}
              {isCameraActive && (
                <>
                  <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                  <Button onClick={handleCapture} className="w-full" disabled={!hasCameraPermission}>
                    <Camera className="mr-2 h-4 w-4" /> Capture Photo
                  </Button>
                </>
              )}
              {hasCameraPermission === false && (
                <Alert variant="destructive">
                  <AlertTitle>Camera Access Denied</AlertTitle>
                  <AlertDescription>Please enable camera permissions to use this feature.</AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="stock" className="mt-4">
            <div className="grid grid-cols-3 gap-4">
                {STOCK_AVATARS.map((avatar) => (
                    <button
                        key={avatar.url}
                        type="button"
                        onClick={() => setNewAvatarUrl(avatar.url)}
                        className={cn(
                            "rounded-md border-2 p-1 transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                            newAvatarUrl === avatar.url ? "border-primary" : "border-transparent"
                        )}
                    >
                        <Image src={avatar.url} alt="Stock Avatar" width={100} height={100} className="rounded-md aspect-square object-cover" data-ai-hint={avatar.hint} />
                    </button>
                ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading || !newAvatarUrl}>
            {isLoading ? <LoadingSpinner className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
