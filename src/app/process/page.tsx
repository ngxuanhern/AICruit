
'use client';

import React, { useState, useEffect } from 'react';
import { PageTitle } from '@/components/shared/PageTitle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileText, UploadCloud, Loader2, AlertTriangle, CheckCircle2, ListChecks, Mail, NotebookText, LinkIcon, Bot, MessageSquareWarning, Skull, CheckCircle, MessageCircleHeart, Library, Building, Github as GithubIcon, FileUp } from 'lucide-react';
import { processApplicationAction } from '@/lib/actions';
import type { ProcessApplicationOutput, AuthenticityInformation } from '@/lib/types';
import { useCandidates } from '@/context/CandidateContext';
import { useJobDescriptions } from '@/context/JobDescriptionContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";

const getAuthenticityStatusDisplay = (authenticityData?: AuthenticityInformation): { 
  text: string; 
  icon?: React.ElementType, 
  colorClass: string, 
  variant: "default" | "destructive" | "secondary",
  educationGenuineText: string,
  educationIcon?: React.ElementType,
  educationColorClass: string,
  experienceGenuineText: string,
  experienceIcon?: React.ElementType,
  experienceColorClass: string
} => {
  const defaults = {
    text: 'N/A', 
    icon: undefined, 
    colorClass: 'text-muted-foreground', 
    variant: 'secondary' as "default" | "destructive" | "secondary",
    educationGenuineText: 'Education: N/A',
    educationIcon: undefined,
    educationColorClass: 'text-muted-foreground',
    experienceGenuineText: 'Experience: N/A',
    experienceIcon: undefined,
    experienceColorClass: 'text-muted-foreground'
  };

  if (!authenticityData) return defaults;

  const { isPotentiallyAiGenerated, isPotentiallyFraudulent, educationSeemsGenuine, experienceSeemsGenuine } = authenticityData;
  let mainStatus = { ...defaults };

  if (isPotentiallyAiGenerated && isPotentiallyFraudulent) {
    mainStatus = { ...mainStatus, text: 'Fake & AI-Generated', icon: Skull, colorClass: 'text-destructive', variant: 'destructive' };
  } else if (isPotentiallyAiGenerated) {
    mainStatus = { ...mainStatus, text: 'AI-Generated', icon: Bot, colorClass: 'text-destructive', variant: 'destructive' };
  } else if (isPotentiallyFraudulent) {
    mainStatus = { ...mainStatus, text: 'Fake', icon: MessageSquareWarning, colorClass: 'text-destructive', variant: 'destructive' };
  } else {
    mainStatus = { ...mainStatus, text: 'Verified', icon: CheckCircle, colorClass: 'text-green-600', variant: 'default' };
  }
  
  mainStatus.educationGenuineText = educationSeemsGenuine ? 'Education: Seems Genuine' : 'Education: Questionable';
  mainStatus.educationIcon = educationSeemsGenuine ? CheckCircle : AlertTriangle;
  mainStatus.educationColorClass = educationSeemsGenuine ? 'text-green-600' : 'text-destructive';

  mainStatus.experienceGenuineText = experienceSeemsGenuine ? 'Experience: Seems Genuine' : 'Experience: Questionable';
  mainStatus.experienceIcon = experienceSeemsGenuine ? CheckCircle : AlertTriangle;
  mainStatus.experienceColorClass = experienceSeemsGenuine ? 'text-green-600' : 'text-destructive';
  
  return mainStatus;
};


export default function ProcessApplicationPage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
  const [onlineProfileUrl, setOnlineProfileUrl] = useState<string>('');
  const [githubUrl, setGithubUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ProcessApplicationOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { addCandidate } = useCandidates();
  const { jobDescriptions, loading: jdsLoading } = useJobDescriptions();
  const { toast } = useToast();

  useEffect(() => {
    setResult(null);
    setError(null);
  }, [resumeFile, coverLetterFile, onlineProfileUrl, githubUrl]);

  const handleResumeFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setResumeFile(event.target.files[0]);
    }
  };

  const handleCoverLetterFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setCoverLetterFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!resumeFile) {
      setError('Please provide a resume file.');
      return;
    }
    if (jobDescriptions.length === 0 && !jdsLoading) {
      setError('No job descriptions found. Please add job descriptions before processing applications.');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const processedData = await processApplicationAction(
        resumeFile, 
        jobDescriptions,
        coverLetterFile || undefined, 
        onlineProfileUrl || undefined,
        githubUrl || undefined
      );

      if (processedData.error) {
        setError(processedData.error);
        setResult(null);
        toast({
          title: "Processing Error",
          description: processedData.error,
          variant: "destructive",
        });
      } else {
        setResult(processedData);
        addCandidate(processedData); 
        toast({
          title: "Processing Successful",
          description: `${processedData.fileName} processed. ${processedData.draftedInterviewEmail ? 'Interview email drafted.' : ''}`,
          variant: "default",
          action: <Link href={`/candidates?highlight=${processedData.id}`} className="underline">View Candidate</Link>,
        });
        setResumeFile(null);
        setCoverLetterFile(null);
        setOnlineProfileUrl('');
        setGithubUrl('');
        if (document.getElementById('resumeFile')) {
            (document.getElementById('resumeFile') as HTMLInputElement).value = '';
        }
        if (document.getElementById('coverLetterFile')) {
            (document.getElementById('coverLetterFile') as HTMLInputElement).value = '';
        }
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      setResult(null);
      toast({
        title: "Processing Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageTitle
        title="Process Application"
        description="Upload a resume. Optionally add a cover letter file (PDF, DOCX, TXT) and online profile URL. The system will match to a job, extract data, rank, verify authenticity, and draft emails."
        icon={UploadCloud}
      />

      <Card>
        <CardHeader>
          <CardTitle>New Application</CardTitle>
          <CardDescription>
            Upload a resume file. Optionally, upload a cover letter file and provide an online profile URL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jdsLoading ? (
            <div className="flex items-center justify-center h-20">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading job descriptions...
            </div>
          ) : jobDescriptions.length === 0 ? (
             <Alert variant="default" className="mb-4 bg-primary/10 border-primary/30">
              <ListChecks className="h-4 w-4 text-primary" />
              <AlertTitle className="text-primary">No Job Descriptions Found</AlertTitle>
              <AlertDescription>
                There are no job descriptions currently in the system. 
                Please <Link href="/job-descriptions" className="font-semibold underline hover:text-primary/80">add job descriptions</Link> before processing applications.
              </AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="resumeFile" className="flex items-center"><FileUp className="mr-2 h-4 w-4 text-muted-foreground"/>Resume File (Required)</Label>
              <Input
                id="resumeFile"
                type="file"
                accept=".pdf,.txt,image/png,image/jpeg,image/jpg,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                onChange={handleResumeFileChange}
                required
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
              <p className="text-sm text-muted-foreground">Supported resume formats: PDF, DOCX, DOC, TXT, PNG, JPG/JPEG.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverLetterFile" className="flex items-center"><NotebookText className="mr-2 h-4 w-4 text-muted-foreground"/>Cover Letter File (Optional)</Label>
              <Input
                id="coverLetterFile"
                type="file"
                accept=".pdf,.txt,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleCoverLetterFileChange}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
              <p className="text-sm text-muted-foreground">Supported cover letter formats: PDF, DOCX, DOC, TXT.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="onlineProfileUrl" className="flex items-center"><LinkIcon className="mr-2 h-4 w-4 text-muted-foreground"/>Online Profile URL (Optional)</Label>
              <Input
                id="onlineProfileUrl"
                type="text" 
                value={onlineProfileUrl}
                onChange={(e) => setOnlineProfileUrl(e.target.value)}
                placeholder="e.g., https://www.linkedin.com/in/yourprofile"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="githubUrl" className="flex items-center"><GithubIcon className="mr-2 h-4 w-4 text-muted-foreground"/>GitHub Profile URL (Optional)</Label>
              <Input
                id="githubUrl"
                type="text" 
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="e.g., https://github.com/username"
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={isLoading || (jobDescriptions.length === 0 && !jdsLoading)} className="w-full sm:w-auto">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Process Application
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && !result.error && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle2 className="h-6 w-6 mr-2 text-green-500" />
              Processing Complete
            </CardTitle>
            <CardDescription>
              Summary for {result.fileName}:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.matchedJobDescriptionTitle && (
              <div>
                <h3 className="font-semibold text-lg">Matched Job Description:</h3>
                <p>{result.matchedJobDescriptionTitle}</p>
              </div>
            )}
             {result.extractedData && (
              <div>
                <h3 className="font-semibold text-lg">Extracted Information:</h3>
                <p><strong>Name:</strong> {result.extractedData.personalInformation.name}</p>
                <p><strong>Email:</strong> {result.extractedData.personalInformation.email}</p>
                <p><strong>Skills:</strong> {result.extractedData.skills.slice(0,5).join(', ')}{result.extractedData.skills.length > 5 ? '...' : ''}</p>
              </div>
            )}
            {result.rankingData && (
              <div>
                <h3 className="font-semibold text-lg">Screening & Ranking:</h3>
                <p><strong>Rank:</strong> {result.rankingData.ranking}/100</p>
                <p className="text-sm text-muted-foreground"><strong>Reason:</strong> {result.rankingData.reason}</p>
              </div>
            )}
            {result.potentialStory && (
              <div>
                <h3 className="font-semibold text-lg flex items-center"><MessageCircleHeart className="mr-2 h-5 w-5 text-primary" />Candidate Potential Story:</h3>
                <p className="text-sm text-muted-foreground italic">"{result.potentialStory}"</p>
              </div>
            )}
            {result.authenticityData && (() => {
              const authStatus = getAuthenticityStatusDisplay(result.authenticityData);
              const MainIcon = authStatus.icon;
              const EduIcon = authStatus.educationIcon;
              const ExpIcon = authStatus.experienceIcon;
              return (
                <div>
                  <h3 className="font-semibold text-lg">Authenticity Verification:</h3>
                   <p className="flex items-center">
                    <strong>Overall Status:</strong>&nbsp;
                    {MainIcon && <MainIcon className={`mr-1.5 h-4 w-4 ${authStatus.colorClass}`} />}
                    <span className={`${authStatus.colorClass} font-semibold`}>{authStatus.text}</span>
                  </p>
                  <p className="text-sm text-muted-foreground ml-2">
                    AI-Generated: <span className={result.authenticityData?.isPotentiallyAiGenerated ? 'text-destructive font-semibold' : ''}>{result.authenticityData?.isPotentiallyAiGenerated ? 'Suspected' : 'Not Suspected'}</span>
                  </p>
                  <p className={`flex items-center text-sm text-muted-foreground ml-2`}>
                    {EduIcon && <EduIcon className={`inline mr-1.5 h-4 w-4 ${authStatus.educationColorClass}`} />}
                    <span className={`${authStatus.educationColorClass}`}>{authStatus.educationGenuineText}</span>
                  </p>
                   <p className={`flex items-center text-sm text-muted-foreground ml-2`}>
                    {ExpIcon && <ExpIcon className={`inline mr-1.5 h-4 w-4 ${authStatus.experienceColorClass}`} />}
                     <span className={`${authStatus.experienceColorClass}`}>{authStatus.experienceGenuineText}</span>
                  </p>
                  <p className="text-sm text-muted-foreground"><strong>Reason:</strong> {result.authenticityData.reason}</p>
                </div>
              );
            })()}
            {result.draftedInterviewEmail && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="font-semibold text-lg flex items-center"><Mail className="mr-2 h-5 w-5 text-primary" />Drafted Interview Email:</h3>
                <p className="mt-1"><strong>To:</strong> {result.extractedData?.personalInformation.email}</p>
                <p><strong>Subject:</strong> {result.draftedInterviewEmail.subject}</p>
                <p className="mt-2 font-medium">Body:</p>
                <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md">{result.draftedInterviewEmail.body}</p>
              </div>
            )}
            <Button asChild variant="outline" className="mt-4">
              <Link href={`/candidates?highlight=${result.id}`}>View Full Details in Candidates List</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

