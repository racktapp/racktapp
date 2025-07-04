
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
  DialogClose,
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
  'https://placehold.co/100x100/EBF4FF/3982F6.png', 
  'https://placehold.co/100x100/FFF0E6/E67700.png',
  'https://placehold.co/100x100/2D3748/F4F7F9.png'
];

interface EditProfileDialogProps {
  children: ReactNode;
  user: User;
}

export function EditProfileDialog({ children, user }: EditProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // States for different image sources
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedStockAvatar, setSelectedStockAvatar] = useState<string | null>(null);

  // For camera
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  useEffect(() => {
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [selectedFile]);

  const clearSelections = (except?: 'file' | 'camera' | 'stock') => {
    if (except !== 'file') { setSelectedFile(null); setPreview(null); }
    if (except !== 'camera') { setCapturedImage(null); }
    if (except !== 'stock') { setSelectedStockAvatar(null); }
    if (videoRef.current?.srcObject) stopCamera();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      clearSelections('file');
      setSelectedFile(e.target.files[0]);
    }
  };

  const startCamera = async () => {
    clearSelections('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasCameraPermission(true);
    } catch (error) {
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings.',
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        clearSelections('camera');
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleStockAvatarSelect = (url: string) => {
    clearSelections('stock');
    setSelectedStockAvatar(url);
  };

  const handleUpload = async () => {
    if (!auth.currentUser) {
      toast({ variant: 'destructive', title: 'Not Authenticated', description: 'You must be logged in to change your picture.' });
      return;
    }

    setIsLoading(true);

    let newAvatarUrl: string | null = null;
    
    try {
      if (selectedStockAvatar) {
        newAvatarUrl = selectedStockAvatar;
      } else if (selectedFile || capturedImage) {
        let uploadable: string;
        if (selectedFile) {
          uploadable = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(selectedFile);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
          });
        } else {
          uploadable = capturedImage!;
        }
        
        const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}`);
        const snapshot = await uploadString(storageRef, uploadable, 'data_url');
        newAvatarUrl = await getDownloadURL(snapshot.ref);
      } else {
        toast({ variant: 'destructive', title: 'No image selected', description: 'Please select an image to upload.' });
        setIsLoading(false);
        return;
      }

      if (newAvatarUrl) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { avatar: newAvatarUrl });
        await updateProfile(auth.currentUser, { photoURL: newAvatarUrl });
        toast({ title: 'Success', description: 'Profile picture updated! The change will appear shortly.' });
        setOpen(false);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.code === 'storage/unauthorized' || error.code === 'permission-denied' 
          ? 'Permission denied. Please check your Storage and Firestore security rules.'
          : error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      clearSelections();
      setHasCameraPermission(null);
    }
  };
  
  const currentPreviewSrc = preview || capturedImage || selectedStockAvatar;

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
          {currentPreviewSrc ? (
            <Image src={currentPreviewSrc} alt="Avatar preview" width={160} height={160} className="h-full w-auto object-contain rounded-md" />
          ) : (
            <UserAvatar user={user} className="h-24 w-24" />
          )}
        </div>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" onClick={() => clearSelections('file')}><Upload className="mr-2 h-4 w-4" /> Upload</TabsTrigger>
            <TabsTrigger value="camera" onClick={startCamera}><Camera className="mr-2 h-4 w-4" /> Camera</TabsTrigger>
            <TabsTrigger value="stock" onClick={() => clearSelections('stock')}><ImageIcon className="mr-2 h-4 w-4" /> Stock</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <Input type="file" accept="image/*" onChange={handleFileChange} className="file:text-primary file:font-medium" />
          </TabsContent>

          <TabsContent value="camera" className="mt-4">
            <div className="space-y-4">
              {!capturedImage && (
                <div className="relative">
                   <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                   <canvas ref={canvasRef} className="hidden" />
                </div>
              )}
              {hasCameraPermission === false && (
                <Alert variant="destructive">
                  <AlertTitle>Camera Access Required</AlertTitle>
                  <AlertDescription>Please allow camera access in your browser to use this feature.</AlertDescription>
                </Alert>
              )}
              {hasCameraPermission && !capturedImage && (
                <Button onClick={handleCapture} className="w-full">
                  <Camera className="mr-2 h-4 w-4" /> Capture Photo
                </Button>
              )}
               {capturedImage && (
                <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Photo Captured!</AlertTitle>
                    <AlertDescription>Click "Save Changes" to apply your new picture.</AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="stock" className="mt-4">
            <div className="grid grid-cols-3 gap-4">
                {STOCK_AVATARS.map((avatarUrl, index) => (
                    <button
                        key={avatarUrl}
                        type="button"
                        onClick={() => handleStockAvatarSelect(avatarUrl)}
                        className={cn(
                            "rounded-md border-2 p-1 transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                            selectedStockAvatar === avatarUrl ? "border-primary" : "border-transparent"
                        )}
                    >
                        <Image src={avatarUrl} alt="Stock Avatar" width={100} height={100} className="rounded-md aspect-square object-cover" data-ai-hint={index === 0 ? "gradient avatar" : (index === 1 ? "abstract pattern" : "dark mode pattern")} />
                    </button>
                ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleUpload} disabled={isLoading || !currentPreviewSrc}>
            {isLoading ? <LoadingSpinner className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
