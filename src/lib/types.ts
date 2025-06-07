export interface ExtractedPersonalInformation {
  name: string;
  email: string;
  phone: string;
  linkedin?: string;
  github?: string;
}

export interface ExtractedExperience {
  title: string;
  company: string;
  dates?: string | null;
  description: string;
  industry?: string | null;
}

export interface ExtractedEducation {
  degree: string;
  institution: string;
  dates?: string | null;
}

export interface ExtractedProject {
  name: string;
  role?: string | null;
  dates?: string | null;
  description: string;
  technologies?: string[];
}

export interface ExtractedInformation {
  personalInformation: ExtractedPersonalInformation;
  workExperience: ExtractedExperience[];
  education: ExtractedEducation[];
  skills: string[];
  projects: ExtractedProject[];
}

export interface RankingInformation {
  name: string; // Ensure this matches the candidate name
  ranking: number; // 0-100
  reason: string;
  overallConfidenceScore: number;
}

export interface AuthenticityInformation {
  isPotentiallyAiGenerated: boolean; 
  isPotentiallyFraudulent: boolean; 
  educationSeemsGenuine: boolean; // New: True if listed education institutions seem real
  experienceSeemsGenuine: boolean; // New: True if listed companies seem real
  overallConfidenceScore: number; 
  reason: string; 
}

export interface JobDescription {
  id: string;
  title: string;
  companyName: string;
  fullText: string;
  createdAt: string; // ISO date string
}

export interface DraftedEmail {
  subject: string;
  body: string;
}

export interface Candidate {
  id: string; 
  fileName?: string; 
  matchedJobDescriptionId?: string; 
  matchedJobDescriptionTitle?: string; 
  extractedData?: ExtractedInformation;
  rankingData?: RankingInformation; 
  authenticityData?: AuthenticityInformation;
  applicationTextContent?: string; 
  draftedInterviewEmail?: DraftedEmail; 
  potentialStory?: string; 
  processedAt: string; // ISO date string
}

export interface ProcessApplicationInput {
  resumeFile: File;
  coverLetterFile?: File;
  allJobDescriptions?: JobDescription[]; 
}

export interface ProcessApplicationOutput {
  id: string;
  fileName?: string;
  matchedJobDescriptionId?: string;
  matchedJobDescriptionTitle?: string;
  extractedData?: ExtractedInformation;
  rankingData?: RankingInformation;
  authenticityData?: AuthenticityInformation;
  applicationTextContent?: string;
  draftedInterviewEmail?: DraftedEmail; 
  potentialStory?: string; 
  processedAt: string;
  error?: string;
}
