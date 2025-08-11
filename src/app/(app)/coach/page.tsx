
'use client';
import { useState, useRef } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, Video, CheckCircle, Lightbulb, TriangleAlert } from 'lucide-react';
import { analyzeSwingAction } from '@/lib/actions';
import type { SwingAnalysisOutput } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { useSport } from '@/components/providers/sport-provider';
import { SPORTS, Sport } from '@/lib/constants';

const SHOT_TYPES = ['Forehand', 'Backhand', 'Serve'];

export default function CoachPage() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const { sport: defaultSport } = useSport();
  const [sport, setSport] = useState<Sport>(defaultSport);
  const [shotType, setShotType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<SwingAnalysisOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) { // 25MB limit
        toast({ variant: 'destructive', title: 'File too large', description: 'Please upload a video smaller than 25MB.' });
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setAnalysis(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!videoFile || !shotType || !sport) {
      toast({ variant: 'destructive', title: 'Missing information', description: 'Please upload a video, select a sport, and select a shot type.' });
      return;
    }
    if (!user) {
        toast({ variant: 'destructive', title: 'Not Authenticated', description: 'You must be logged in to use the AI Coach.' });
        return;
    }
    
    setIsLoading(true);
    setAnalysis(null);
    setError(null);

    const reader = new FileReader();
    reader.readAsDataURL(videoFile);
    reader.onload = async (event) => {
        try {
            const videoDataUri = event.target?.result as string;
            if (!videoDataUri) {
                throw new Error('Could not read video file.');
            }
            const result = await analyzeSwingAction({ videoDataUri, sport, shotType }, user.uid);
            setAnalysis(result);
        } catch (err: any) {
            const errorMessage = err.message || 'An unexpected error occurred during analysis.';
            setError(errorMessage);
            toast({ variant: 'destructive', title: 'Analysis Failed', description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };
    reader.onerror = () => {
        const errorMessage = 'Failed to process video file.';
        setError(errorMessage);
        toast({ variant: 'destructive', title: 'File Error', description: errorMessage });
        setIsLoading(false);
    };
  };
  
  const resetState = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setAnalysis(null);
    setError(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <PageHeader
        title={<><span>AI Coach</span><Badge variant="outline" className="ml-2">Beta</Badge></>}
        description="Upload a video of your swing for AI-powered analysis."
      />
      <Card>
        <CardContent className="pt-6">
          {!analysis ? (
            <div className="grid gap-6">
              <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                  {videoPreview ? (
                    <video src={videoPreview} className="h-full w-full object-contain rounded-lg" controls />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Video className="w-10 h-10 mb-4 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-muted-foreground">Short video clip (MAX. 25MB)</p>
                    </div>
                  )}
                  <Input id="dropzone-file" type="file" className="hidden" accept="video/*" onChange={handleFileChange} ref={fileInputRef} />
                </label>
              </div>

              {videoPreview && (
                <div className="grid sm:grid-cols-3 gap-4 items-end">
                    <Select onValueChange={(v) => setSport(v as Sport)} value={sport}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select sport..." />
                        </SelectTrigger>
                        <SelectContent>
                            {SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select onValueChange={setShotType} value={shotType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select shot type..." />
                        </SelectTrigger>
                        <SelectContent>
                            {SHOT_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleAnalyze} disabled={isLoading || !videoFile || !shotType || !sport || !user}>
                        {isLoading ? <LoadingSpinner className="mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
                        {isLoading ? 'Analyzing...' : 'Analyze Video'}
                    </Button>
                </div>
              )}
              {error && (
                <Alert variant="destructive">
                  <TriangleAlert className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="space-y-6">
                {analysis.isCorrectShotType ? (
                    <>
                        <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertTitle>Analysis Complete!</AlertTitle>
                            <AlertDescription>{analysis.summary}</AlertDescription>
                        </Alert>
                        <div className="grid md:grid-cols-3 gap-4">
                            <Card>
                                <CardHeader><CardTitle>Preparation</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-1 text-green-500 flex-shrink-0" /><p className="text-sm">{analysis.preparation.positive}</p></div>
                                    <div className="flex items-start gap-2"><Lightbulb className="h-4 w-4 mt-1 text-yellow-500 flex-shrink-0" /><p className="text-sm">{analysis.preparation.improvement}</p></div>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader><CardTitle>Execution</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-1 text-green-500 flex-shrink-0" /><p className="text-sm">{analysis.execution.positive}</p></div>
                                    <div className="flex items-start gap-2"><Lightbulb className="h-4 w-4 mt-1 text-yellow-500 flex-shrink-0" /><p className="text-sm">{analysis.execution.improvement}</p></div>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader><CardTitle>Follow-through</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-1 text-green-500 flex-shrink-0" /><p className="text-sm">{analysis.followThrough.positive}</p></div>
                                    <div className="flex items-start gap-2"><Lightbulb className="h-4 w-4 mt-1 text-yellow-500 flex-shrink-0" /><p className="text-sm">{analysis.followThrough.improvement}</p></div>
                                </CardContent>
                            </Card>
                        </div>
                    </>
                ) : (
                    <Alert variant="destructive">
                         <TriangleAlert className="h-4 w-4" />
                         <AlertTitle>Shot Mismatch</AlertTitle>
                         <AlertDescription>{analysis.summary} You selected {shotType}, but the AI detected a {analysis.detectedShotType}. Please upload the correct video or select the correct shot type.</AlertDescription>
                    </Alert>
                )}
                <Button onClick={resetState} variant="outline">Analyze Another Swing</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
