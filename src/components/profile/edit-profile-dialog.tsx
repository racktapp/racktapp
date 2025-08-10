'use client';

import { ReactNode, useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, storage } from '@/lib/firebase/config';
import { updateUserAvatarAction } from '@/lib/actions';

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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';
import { UserAvatar } from '../user-avatar';
import { STOCK_AVATARS } from '@/lib/constants';

interface EditProfileDialogProps {
  children: ReactNode;
  user: User;
}

export function EditProfileDialog({ children, user }: EditProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('upload');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
        fetch(dataUrl)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
                setSelectedFile(file);
                setPreviewUrl(URL.createObjectURL(file));
                stopCamera();
            });
      }
    }
  };

  // --- File upload handler ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };
  
  const resetState = () => {
    stopCamera();
    setPreviewUrl(null);
    setSelectedFile(null);
    setHasCameraPermission(null);
    setActiveTab('upload');
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  // --- Tab change handler ---
  const onTabChange = (value: string) => {
    resetState();
    setActiveTab(value);
    if (value === 'camera') {
        startCamera();
    }
  };

  // --- Dialog open/close handler ---
  const onOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetState();
    }
  };
  
  // --- Main save handler ---
  const handleSave = async () => {
    if (!previewUrl) {
      toast({ variant: 'destructive', title: 'No image selected' });
      return;
    }
    if (!auth.currentUser) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'Please log in again.' });
        return;
    }
    
    setIsLoading(true);

    try {
      let finalUrl = previewUrl;

      // Step 1: If a new file was uploaded/captured, upload it to Firebase Storage.
      // This now happens entirely on the client-side.
      if (selectedFile) {
        const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${selectedFile.name}`);
        const uploadResult = await uploadBytes(storageRef, selectedFile);
        finalUrl = await getDownloadURL(uploadResult.ref);
      }
      
      // If a user selected a stock avatar, `finalUrl` is already the correct URL.
      
      // Step 2: Update the user's Firestore document via a simple Server Action.
      const updateDbResult = await updateUserAvatarAction(user.uid, finalUrl);
      if (!updateDbResult.success) throw new Error(updateDbResult.message);
      
      // Step 3: Update the user's profile in Firebase Authentication (client-side).
      await updateProfile(auth.currentUser, { photoURL: finalUrl });

      toast({ title: 'Success!', description: 'Profile picture updated.' });
      onOpenChange(false);
      router.refresh(); // Refresh page to show new avatar everywhere.

    } catch (error: any) {
      console.error("Error during avatar save process:", error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'An unexpected error occurred. Please check storage rules in Firebase.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const previewSrc = previewUrl || user.avatarUrl;

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
                 <Image src={previewSrc} alt="Avatar preview" width={160} height={160} className="h-full w-auto object-contain rounded-md" unoptimized />
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
              {!isCameraActive && previewUrl && (
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
                        onClick={() => {
                            setSelectedFile(null);
                            setPreviewUrl(avatar.url);
                        }}
                        className={cn(
                            "rounded-md border-2 p-1 transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                            previewUrl === avatar.url ? "border-primary" : "border-transparent"
                        )}
                    >
                        <Image src={avatar.url} alt="Stock Avatar" width={100} height={100} className="rounded-md aspect-square object-cover" unoptimized />
                    </button>
                ))}
            </div>
            <p className="text-xs text-center text-muted-foreground mt-4">
              Stock avatars are linked directly and not uploaded to your storage.
            </p>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading || !previewUrl}>
            {isLoading ? <LoadingSpinner className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
