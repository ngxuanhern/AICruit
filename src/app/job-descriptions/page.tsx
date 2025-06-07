'use client';

import React, { useState } from 'react';
import { PageTitle } from '@/components/shared/PageTitle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useJobDescriptions } from '@/context/JobDescriptionContext';
import type { JobDescription } from '@/lib/types';
import { FileText, PlusCircle, Edit2, Trash2, ListChecks } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

const JobDescriptionForm = ({
  jobDescription,
  onSave,
  onCancel,
}: {
  jobDescription?: JobDescription;
  onSave: (jd: Omit<JobDescription, 'id' | 'createdAt'> | JobDescription) => void;
  onCancel: () => void;
}) => {
  const [title, setTitle] = useState(jobDescription?.title || '');
  const [companyName, setCompanyName] = useState(jobDescription?.companyName || '');
  const [fullText, setFullText] = useState(jobDescription?.fullText || '');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !companyName.trim() || !fullText.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a title, company name, and the full text for the job description.",
        variant: "destructive",
      });
      return;
    }
    onSave(jobDescription ? { ...jobDescription, title, companyName, fullText } : { title, companyName, fullText });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="jdCompanyName">Company Name</Label>
        <Input
          id="jdCompanyName"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="e.g., Tech Solutions Inc."
          required
          className="border border-gray-300"
        />
      </div>
      <div>
        <Label htmlFor="jdTitle">Job Title</Label>
        <Input
          id="jdTitle"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Senior Software Engineer"
          required
          className="border border-gray-300"
        />
      </div>
      <div>
        <Label htmlFor="jdFullText">Full Job Description Text</Label>
        <Textarea
          id="jdFullText"
          value={fullText}
          onChange={(e) => setFullText(e.target.value)}
          placeholder="Paste or write the full job description here..."
          required
          rows={15}
          className="border border-gray-300 min-h-[300px]"
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{jobDescription ? 'Save Changes' : 'Add Job Description'}</Button>
      </DialogFooter>
    </form>
  );
};

export default function JobDescriptionsPage() {
  const { jobDescriptions, addJobDescription, updateJobDescription, deleteJobDescription, loading } = useJobDescriptions();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJobDescription, setEditingJobDescription] = useState<JobDescription | undefined>(undefined);
  const { toast } = useToast();

  const handleSave = (jdData: Omit<JobDescription, 'id' | 'createdAt'> | JobDescription) => {
    if ('id' in jdData) {
      updateJobDescription(jdData as JobDescription);
      toast({ title: "Job Description Updated", description: `"${jdData.title}" has been updated.` });
    } else {
      addJobDescription(jdData);
      toast({ title: "Job Description Added", description: `"${jdData.title}" has been added.` });
    }
    setIsFormOpen(false);
    setEditingJobDescription(undefined);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle title="Job Descriptions" description="Manage your company's job descriptions." icon={ListChecks} />

      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) setEditingJobDescription(undefined);
      }}>
        <DialogTrigger asChild>
          <Button onClick={() => { setEditingJobDescription(undefined); setIsFormOpen(true); }}>
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Job Description
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingJobDescription ? 'Edit Job Description' : 'Add New Job Description'}</DialogTitle>
            <DialogDescription>
              {editingJobDescription ? 'Modify the details below.' : 'Fill in the details to add a new job description.'}
            </DialogDescription>
          </DialogHeader>
          <JobDescriptionForm
            jobDescription={editingJobDescription}
            onSave={handleSave}
            onCancel={() => { setIsFormOpen(false); setEditingJobDescription(undefined); }}
          />
        </DialogContent>
      </Dialog>

      {jobDescriptions.length === 0 && !loading ? (
        <Card className="mt-6">
          <CardContent className="py-10 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-medium">No Job Descriptions Yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Click "Add New Job Description" to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobDescriptions.map((jd) => (
            <Card key={jd.id}>
              <CardHeader>
                <CardTitle className="truncate text-xl">{jd.title}</CardTitle>
                <CardDescription>Added on: {format(parseISO(jd.createdAt), 'PPP')}</CardDescription>
              </CardHeader>
              <CardContent className="h-32">
                <ScrollArea className="h-full">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-5">
                    {jd.fullText}
                  </p>
                </ScrollArea>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                 {/* Removed DialogTrigger wrapper from here */}
                 <Button variant="outline" size="sm" onClick={() => { setEditingJobDescription(jd); setIsFormOpen(true);}}>
                   <Edit2 className="mr-1 h-4 w-4" /> Edit
                 </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-1 h-4 w-4" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the job description titled "{jd.title}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          deleteJobDescription(jd.id);
                          toast({ title: "Job Description Deleted", description: `"${jd.title}" has been deleted.` });
                        }}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
