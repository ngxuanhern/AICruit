'use client';

import React, { useState, useMemo } from 'react';
import { PageTitle } from '@/components/shared/PageTitle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Trash2, Eye, CheckCircle, AlertTriangle, Star, Briefcase, GraduationCap, Palette, FileText as JobIcon, Mail, Sparkles, Skull, MessageSquareWarning, Bot, MessageCircleHeart, Building, Library, ListFilter, Check, ChevronsUpDown } from 'lucide-react';
import type { Candidate, AuthenticityInformation, ExtractedExperience } from '@/lib/types';
import { useCandidates } from '@/context/CandidateContext';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO } from 'date-fns';
import { useSearchParams } from 'next/navigation';
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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from '@/lib/utils';

const ALL_SKILLS_VALUE = "__ALL_SKILLS__";

const getAuthenticityStatus = (authenticityData?: AuthenticityInformation): { text: string; variant: "default" | "destructive" | "secondary"; icon?: React.ElementType } => {
  if (!authenticityData) return { text: 'N/A', variant: 'secondary' };

  const { isPotentiallyAiGenerated, isPotentiallyFraudulent } = authenticityData;

  if (isPotentiallyAiGenerated && isPotentiallyFraudulent) {
    return { text: 'Fake & AI-Gen', variant: 'destructive', icon: Skull };
  }
  if (isPotentiallyAiGenerated) {
    return { text: 'AI-Generated', variant: 'destructive', icon: Bot };
  }
  if (isPotentiallyFraudulent) {
    return { text: 'Fake', variant: 'destructive', icon: MessageSquareWarning };
  }
  return { text: 'Verified', variant: 'default', icon: CheckCircle };
};


const CandidateDetailsModal = ({ candidate }: { candidate: Candidate }) => {
  const authenticityStatus = getAuthenticityStatus(candidate.authenticityData);

  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle className="text-2xl font-headline">{candidate.extractedData?.personalInformation.name || 'Candidate Details'}</DialogTitle>
        <DialogDescription>
          Detailed information for {candidate.fileName}. Processed on {format(parseISO(candidate.processedAt), "PPP p")}.
        </DialogDescription>
      </DialogHeader>
      <ScrollArea className="max-h-[70vh] p-1">
        <div className="space-y-6 pr-4">
          {candidate.matchedJobDescriptionTitle && (
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center"><JobIcon className="mr-2 h-5 w-5 text-primary" />Matched Job Role</CardTitle></CardHeader>
              <CardContent><p className="text-sm font-semibold">{candidate.matchedJobDescriptionTitle}</p></CardContent>
            </Card>
          )}

          {candidate.extractedData && (
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center"><Users className="mr-2 h-5 w-5 text-primary" />Personal Information</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <p><strong>Name:</strong> {candidate.extractedData.personalInformation.name}</p>
                <p><strong>Email:</strong> {candidate.extractedData.personalInformation.email}</p>
                <p><strong>Phone:</strong> {candidate.extractedData.personalInformation.phone}</p>
                {candidate.extractedData.personalInformation.linkedin && <p><strong>LinkedIn:</strong> <a href={candidate.extractedData.personalInformation.linkedin} target="_blank" rel="noreferrer" className="text-primary hover:underline">{candidate.extractedData.personalInformation.linkedin}</a></p>}
                {candidate.extractedData.personalInformation.github && <p><strong>GitHub:</strong> <a href={candidate.extractedData.personalInformation.github} target="_blank" rel="noreferrer" className="text-primary hover:underline">{candidate.extractedData.personalInformation.github}</a></p>}
              </CardContent>
            </Card>
          )}

          {candidate.extractedData?.skills && candidate.extractedData.skills.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center"><Palette className="mr-2 h-5 w-5 text-primary" />Skills</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {candidate.extractedData.skills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
              </CardContent>
            </Card>
          )}
          
          {candidate.rankingData && (
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center"><Star className="mr-2 h-5 w-5 text-yellow-500" />Screening & Ranking</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <p><strong>Rank:</strong> <Badge variant={candidate.rankingData.ranking >= 80 ? "default" : "secondary"} className={candidate.rankingData.ranking >= 80 ? "bg-green-500 text-white" : candidate.rankingData.ranking >=60 ? "bg-yellow-500 text-black":"" }>{candidate.rankingData.ranking}/100</Badge></p>
                <p><strong>Reason:</strong> {candidate.rankingData.reason}</p>
              </CardContent>
            </Card>
          )}

          {candidate.potentialStory && (
             <Card>
              <CardHeader><CardTitle className="text-lg flex items-center"><MessageCircleHeart className="mr-2 h-5 w-5 text-primary" />AI-Generated Potential Story</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm italic text-muted-foreground">"{candidate.potentialStory}"</p>
              </CardContent>
            </Card>
          )}

          {candidate.authenticityData && (
             <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  {authenticityStatus.icon && <authenticityStatus.icon className={`mr-2 h-5 w-5 ${authenticityStatus.variant === 'destructive' ? 'text-destructive' : 'text-green-500'}`} />}
                  Authenticity Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                 <p><strong>Overall Status:</strong> <span className={`font-semibold ${authenticityStatus.variant === 'destructive' ? 'text-destructive' : authenticityStatus.variant === 'default' ? 'text-green-600' : ''}`}>{authenticityStatus.text}</span></p>
                 <p><strong>AI Detection:</strong> {candidate.authenticityData.isPotentiallyAiGenerated ? <span className="text-destructive font-semibold">Suspected</span> : 'Not Suspected'}</p>
                 <p><strong>Fraudulent Indicators:</strong> {candidate.authenticityData.isPotentiallyFraudulent ? <span className="text-destructive font-semibold">Found</span> : 'None Found'}</p>
                 <p className="flex items-center"><strong>Education Genuineness:</strong> 
                    {candidate.authenticityData.educationSeemsGenuine ? 
                        <><CheckCircle className="inline ml-1.5 mr-1 h-4 w-4 text-green-600" /> Seems Genuine</> : 
                        <><AlertTriangle className="inline ml-1.5 mr-1 h-4 w-4 text-destructive" /> Questionable</>
                    }
                 </p>
                 <p className="flex items-center"><strong>Experience Genuineness:</strong> 
                    {candidate.authenticityData.experienceSeemsGenuine ? 
                        <><CheckCircle className="inline ml-1.5 mr-1 h-4 w-4 text-green-600" /> Seems Genuine</> : 
                        <><AlertTriangle className="inline ml-1.5 mr-1 h-4 w-4 text-destructive" /> Questionable</>
                    }
                 </p>
                 <p><strong>Confidence (AI/Fraud):</strong> {((candidate.authenticityData.overallConfidenceScore ?? 0) * 100).toFixed(0)}%</p>
                 <p><strong>Reason:</strong> {candidate.authenticityData.reason}</p>
              </CardContent>
            </Card>
          )}

          {candidate.draftedInterviewEmail && (
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center"><Mail className="mr-2 h-5 w-5 text-primary" />Drafted Interview Email</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <p><strong>To:</strong> {candidate.extractedData?.personalInformation.email}</p>
                <p><strong>Subject:</strong> {candidate.draftedInterviewEmail.subject}</p>
                <div className="mt-1">
                    <p className="font-medium mb-1">Body:</p>
                    <p className="whitespace-pre-wrap bg-muted/50 p-3 rounded-md text-muted-foreground">{candidate.draftedInterviewEmail.body}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {candidate.extractedData?.workExperience && candidate.extractedData.workExperience.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary" />Work Experience</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {candidate.extractedData.workExperience.map((exp: ExtractedExperience, idx: number) => (
                  <div key={idx} className="text-sm border-b pb-2 last:border-b-0">
                    <h4 className="font-semibold">{exp.title} at {exp.company}</h4>
                    {exp.industry && exp.industry !== "Unknown Industry" && <p className="text-xs text-muted-foreground/80 flex items-center"><Building className="inline mr-1 h-3 w-3"/>Industry: {exp.industry}</p>}
                    <p className="text-xs text-muted-foreground">{exp.dates}</p>
                    <p className="mt-1 whitespace-pre-wrap">{exp.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          
          {candidate.extractedData?.education && candidate.extractedData.education.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center"><GraduationCap className="mr-2 h-5 w-5 text-primary" />Education</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {candidate.extractedData.education.map((edu, idx) => (
                  <div key={idx} className="text-sm border-b pb-2 last:border-b-0">
                    <h4 className="font-semibold">{edu.degree}</h4>
                    <p className="text-xs text-muted-foreground">{edu.institution} {edu.dates}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {candidate.extractedData?.projects && candidate.extractedData.projects.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center"><Library className="mr-2 h-5 w-5 text-primary" />Project Experience</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {candidate.extractedData.projects.map((project, idx) => (
                  <div key={idx} className="text-sm border-b pb-2 last:border-b-0">
                    <h4 className="font-semibold">{project.name}</h4>
                    {(project.role || project.dates) && (
                      <p className="text-xs text-muted-foreground">
                        {project.role}{project.role && project.dates ? ' ' : ''}{project.dates ? `(${project.dates})` : ''}
                      </p>
                    )}
                    <p className="mt-1 whitespace-pre-wrap">{project.description}</p>
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {project.technologies.map((tech, techIdx) => (
                          <Badge key={techIdx} variant="secondary" className="text-xs">{tech}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

        </div>
      </ScrollArea>
      <DialogFooter className="mt-4">
        <DialogClose asChild>
          <Button variant="outline">Close</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
};


export default function CandidatesPage() {
  const { candidates, deleteCandidate, loading } = useCandidates();
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [openSkillCombobox, setOpenSkillCombobox] = useState(false);
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const uniqueSkills = useMemo(() => {
    const allSkills = new Set<string>();
    candidates.forEach(candidate => {
      candidate.extractedData?.skills.forEach(skill => {
        if (skill && skill.trim() !== "") { 
          allSkills.add(skill.trim());
        }
      });
    });
    return Array.from(allSkills).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }, [candidates]);

  const handleSkillFilterChange = (selectedValue: string) => {
    if (selectedValue === ALL_SKILLS_VALUE) {
      setSkillFilter(''); 
    } else {
      setSkillFilter(selectedValue);
    }
  };

  const filteredCandidates = useMemo(() => {
    return candidates.filter(candidate => {
      const name = candidate.extractedData?.personalInformation.name.toLowerCase() || '';
      const skills = candidate.extractedData?.skills || [];
      const skillsString = skills.join(', ').toLowerCase();
      const matchedJobTitle = candidate.matchedJobDescriptionTitle?.toLowerCase() || '';
      const search = searchTerm.toLowerCase();
      
      const matchesSearch = name.includes(search) || 
                            skillsString.includes(search) || 
                            matchedJobTitle.includes(search) ||
                            (candidate.fileName && candidate.fileName.toLowerCase().includes(search));
      
      const matchesSkill = !skillFilter || skills.some(s => s.toLowerCase() === skillFilter.toLowerCase());
      
      return matchesSearch && matchesSkill;
    });
  }, [candidates, searchTerm, skillFilter]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  const selectedSkillLabel = skillFilter === '' ? "All Skills" : skillFilter;

  return (
    <div className="space-y-6">
      <PageTitle title="Candidates" description="Manage and review processed candidate applications." icon={Users} />

      <Card>
        <CardHeader>
          <CardTitle>Filter & Search</CardTitle>
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by name, job, filename..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative flex-1">
               <ListFilter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                <Popover open={openSkillCombobox} onOpenChange={setOpenSkillCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openSkillCombobox}
                      className="w-full justify-between pl-10"
                    >
                      {selectedSkillLabel}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search skill..." />
                      <CommandList>
                        <CommandEmpty>No skill found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            key="all-skills-item"
                            value="All Skills" 
                            onSelect={() => {
                              handleSkillFilterChange(ALL_SKILLS_VALUE);
                              setOpenSkillCombobox(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                skillFilter === '' ? "opacity-100" : "opacity-0"
                              )}
                            />
                            All Skills
                          </CommandItem>
                          {uniqueSkills.map((skill) => (
                            <CommandItem
                              key={skill}
                              value={skill}
                              onSelect={() => {
                                handleSkillFilterChange(skill);
                                setOpenSkillCombobox(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  skillFilter === skill ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {skill}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCandidates.length === 0 ? (
             <div className="text-center py-10">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-lg font-medium">No candidates found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try adjusting your search or filter, or process new applications.
                </p>
             </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Matched Job</TableHead>
                <TableHead>Ranking</TableHead>
                <TableHead>Authenticity</TableHead>
                <TableHead className="hidden md:table-cell">Key Skills</TableHead>
                <TableHead className="hidden lg:table-cell">Processed At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCandidates.map(candidate => {
                const authenticityStatus = getAuthenticityStatus(candidate.authenticityData);
                const IconComponent = authenticityStatus.icon;

                return (
                <TableRow key={candidate.id} className={candidate.id === highlightId ? 'bg-primary/10' : ''}>
                  <TableCell className="font-medium">{candidate.extractedData?.personalInformation.name || candidate.fileName || 'N/A'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{candidate.matchedJobDescriptionTitle || 'N/A'}</TableCell>
                  <TableCell>
                    {candidate.rankingData ? (
                      <Badge variant={candidate.rankingData.ranking >= 80 ? "default" : "secondary"} className={candidate.rankingData.ranking >= 80 ? "bg-green-600 hover:bg-green-700" : candidate.rankingData.ranking >=60 ? "bg-yellow-500 hover:bg-yellow-600 text-black":""}>
                        {candidate.rankingData.ranking}/100
                      </Badge>
                    ) : <Badge variant="outline">N/A</Badge>}
                  </TableCell>
                  <TableCell>
                     <Badge variant={authenticityStatus.variant} className={authenticityStatus.variant === "default" ? "bg-green-500 hover:bg-green-600 text-primary-foreground" : authenticityStatus.variant === "destructive" ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : ""}>
                        {IconComponent && <IconComponent className="inline mr-1 h-3 w-3" />}
                        {authenticityStatus.text}
                      </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {candidate.extractedData?.skills.slice(0, 3).join(', ') || 'N/A'}
                    {candidate.extractedData && candidate.extractedData.skills.length > 3 ? '...' : ''}
                  </TableCell>
                   <TableCell className="hidden lg:table-cell">{format(parseISO(candidate.processedAt), "PP")}</TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:text-primary">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <CandidateDetailsModal candidate={candidate} />
                    </Dialog>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the candidate data for "{candidate.extractedData?.personalInformation.name || candidate.fileName}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteCandidate(candidate.id)} className="bg-destructive hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


    