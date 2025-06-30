
'use client';

import { ReactNode, useState, useRef, useEffect } from 'react';
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
import { Camera, Upload, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type User } from '@/lib/types';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase/config';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface EditProfileDialogProps {
  children: ReactNode;
  user: User;
}

export function EditProfileDialog({ children, user }: EditProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // For file upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // For camera
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
      setCapturedImage(null);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [selectedFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const startCamera = async () => {
    setCapturedImage(null);
    setSelectedFile(null);
    setPreview(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasCameraPermission(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
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
        setCapturedImage(dataUrl);
        setSelectedFile(null);
        setPreview(null);
        stopCamera();
      }
    }
  };

  const handleUpload = async () => {
    if (!auth.currentUser) {
      toast({ variant: 'destructive', title: 'Not Authenticated', description: 'You must be logged in to change your picture.' });
      return;
    }

    if (!selectedFile && !capturedImage) {
      toast({ variant: 'destructive', title: 'No image selected', description: 'Please select a file or take a photo.' });
      return;
    }

    setIsLoading(true);
    try {
      let uploadable: string;
      if (selectedFile) {
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        uploadable = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
        });
      } else {
        uploadable = capturedImage!;
      }

      const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}`);
      const snapshot = await uploadString(storageRef, uploadable, 'data_url');
      const downloadURL = await getDownloadURL(snapshot.ref);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { avatar: downloadURL });

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: downloadURL });
      }

      toast({ title: 'Success', description: 'Profile picture updated! The change will appear shortly.' });
      setOpen(false);

    } catch (error: any) {
      console.error("Profile picture upload failed:", error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.code === 'storage/unauthorized' || error.code === 'permission-denied' 
          ? 'Permission denied. Please check your Storage and Firestore security rules in the Firebase console.'
          : error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      stopCamera();
      setPreview(null);
      setSelectedFile(null);
      setCapturedImage(null);
      setHasCameraPermission(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile Picture</DialogTitle>
          <DialogDescription>
            Choose a new photo by uploading from your device or using your camera.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" onClick={stopCamera}>
              <Upload className="mr-2 h-4 w-4" /> Upload
            </TabsTrigger>
            <TabsTrigger value="camera" onClick={startCamera}>
              <Camera className="mr-2 h-4 w-4" /> Take Photo
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="mt-4">
            <div className="space-y-4">
              <Input type="file" accept="image/*" onChange={handleFileChange} className="file:text-primary file:font-medium" />
              {(preview || capturedImage) && (
                  <div className="relative">
                    <img src={preview || capturedImage || ''} alt="Preview" className="mx-auto max-h-60 rounded-md" />
                  </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="camera" className="mt-4">
            <div className="space-y-4">
              {capturedImage ? (
                <div className="relative">
                  <img src={capturedImage} alt="Captured" className="mx-auto max-h-60 rounded-md" />
                </div>
              ) : (
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
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleUpload} disabled={isLoading || (!selectedFile && !capturedImage)}>
            {isLoading ? <LoadingSpinner className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
