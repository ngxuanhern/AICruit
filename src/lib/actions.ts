
'use server';

import { extractDataFromResume } from '@/ai/flows/extract-data-from-resume';
import type { ExtractDataFromResumeInput } from '@/ai/flows/extract-data-from-resume';
import { rankCandidatesBySkills } from '@/ai/flows/rank-candidates-by-skills';
import type { RankCandidatesBySkillsInput } from '@/ai/flows/rank-candidates-by-skills';
import { verifyApplicationAuthenticity } from '@/ai/flows/verify-application-authenticity';
import type { VerifyApplicationAuthenticityInput, VerifyApplicationAuthenticityOutput } from '@/ai/flows/verify-application-authenticity';
import { matchCandidateToJobDescription } from '@/ai/flows/match-job-description';
import type { MatchCandidateToJobDescriptionInput } from '@/ai/flows/match-job-description';
import { draftInterviewEmail as draftInterviewEmailFlow } from '@/ai/flows/draft-interview-email';
import type { DraftInterviewEmailInput } from '@/ai/flows/draft-interview-email';
import { generateCandidateStory as generateCandidateStoryFlow } from '@/ai/flows/generate-candidate-story';
import type { GenerateCandidateStoryInput } from '@/ai/flows/generate-candidate-story';
import mammoth from 'mammoth';


import type { ProcessApplicationOutput, ExtractedInformation, RankingInformation, AuthenticityInformation, JobDescription } from './types';

async function fileToDataUri(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return `data:${file.type};base64,${buffer.toString('base64')}`;
}

function generateApplicationText(extractedData: ExtractedInformation | undefined, coverLetterText?: string, onlineProfileUrl?: string): string {
  let text = "";
  if (extractedData?.personalInformation?.name) {
    text += `Candidate: ${extractedData.personalInformation.name}\n\n`;
  }

  if (coverLetterText) {
    text += "Cover Letter Content (or placeholder):\n" + coverLetterText.substring(0, 1000) + "\n\n"; // Increased length for cover letter
  }

  if (extractedData?.workExperience?.length > 0) { // Changed from extractedData?.experience
    text += "Experience Summary (for context):\n";
    extractedData.workExperience.forEach(exp => { // Changed from extractedData.experience
      text += `Title: ${exp.title} at ${exp.company}. Description: ${exp.description?.substring(0,150)}...\n`;
    });
     text += "\n";
  }
  if (extractedData?.education?.length > 0) {
    text += "Education Summary (for context):\n";
    extractedData.education.forEach(edu => {
      text += `Degree: ${edu.degree} from ${edu.institution}.\n`;
    });
    text += "\n";
  }
  if (extractedData?.skills?.length > 0) {
    text += `Skills: ${extractedData.skills.join(', ')}\n\n`;
  }

  if (onlineProfileUrl) { 
    text += "Online Profile URL Provided: " + onlineProfileUrl + "\n(AI will consider typical information from such a profile for authenticity check based on this URL.)\n\n";
  }
  
  if (!text && !coverLetterText && !onlineProfileUrl) {
    return "No textual content available for authenticity check other than structured data which will be passed separately.";
  }

  return text.trim();
}

function generateExperienceSummary(extractedData: ExtractedInformation | undefined): string {
  if (!extractedData || !extractedData.workExperience || extractedData.workExperience.length === 0) { // Changed from extractedData.experience
    return "No prior experience listed.";
  }
  return extractedData.workExperience // Changed from extractedData.experience
    .map(exp => `${exp.title} at ${exp.company || 'N/A'} (${exp.dates || 'N/A'}): ${exp.description}`)
    .join('\n\n');
}

export async function processApplicationAction(
  resumeFile: File,
  allJobDescriptions: JobDescription[],
  coverLetterFile?: File, 
  onlineProfileUrl?: string,
  githubUrl?: string
): Promise<ProcessApplicationOutput> {
  const id = crypto.randomUUID();
  const processedAt = new Date().toISOString();
  const fileName = resumeFile.name;
  const companyName = "AICruit"; 

  let output: ProcessApplicationOutput = {
    id,
    fileName,
    processedAt,
    authenticityData: { 
      isPotentiallyAiGenerated: false,
      isPotentiallyFraudulent: false,
      educationSeemsGenuine: true, 
      experienceSeemsGenuine: true, 
      overallConfidenceScore: 0,
      reason: "Authenticity check not performed or inconclusive.",
    },
  };

  try {
    let resumeDataUriForAi: string;
    const resumeFileBuffer = await resumeFile.arrayBuffer();

    const docxMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const docMimeType = 'application/msword';

    if (resumeFile.type === docxMimeType) {
      try {
        const { value: rawText } = await mammoth.extractRawText({ buffer: Buffer.from(resumeFileBuffer) });
        const base64Text = Buffer.from(rawText).toString('base64');
        resumeDataUriForAi = `data:text/plain;base64,${base64Text}`;
      } catch (extractionError) {
        console.error('Error extracting text from resume DOCX document:', extractionError);
        return { ...output, error: `Failed to extract text from resume DOCX document: ${extractionError instanceof Error ? extractionError.message : String(extractionError)}` };
      }
    } else if (resumeFile.type === docMimeType) {
      console.warn('.doc file type for resume is not supported for text extraction with the current setup. User should convert to .docx, PDF, or TXT.');
      return { ...output, error: `Direct processing of .doc resume files is not supported. Please convert to .docx, PDF, or TXT.` };
    } else {
      resumeDataUriForAi = await fileToDataUri(resumeFile);
    }

    let coverLetterTextForAi: string | undefined = undefined;
    if (coverLetterFile) {
      const clFileBuffer = await coverLetterFile.arrayBuffer();
      if (coverLetterFile.type === docxMimeType) { 
        try {
          const { value: rawText } = await mammoth.extractRawText({ buffer: Buffer.from(clFileBuffer) });
          coverLetterTextForAi = rawText;
        } catch (e) {
          console.warn('Could not extract text from cover letter DOCX:', e);
          coverLetterTextForAi = "Cover letter provided as DOCX, but text extraction failed.";
        }
      } else if (coverLetterFile.type === 'text/plain') { 
        coverLetterTextForAi = Buffer.from(clFileBuffer).toString('utf-8');
      } else if (coverLetterFile.type === 'application/pdf') {
        console.warn('PDF cover letter uploaded. Text extraction from PDF cover letters is not currently implemented in the action. Passing a placeholder to AI.');
        coverLetterTextForAi = `Cover letter provided as a PDF file (${coverLetterFile.name}). Content not directly extracted in this step.`;
      } else if (coverLetterFile.type === docMimeType) { 
         console.warn('.doc file type for cover letter is not supported for text extraction. Passing a placeholder to AI.');
         coverLetterTextForAi = `Cover letter provided as a .doc file (${coverLetterFile.name}). Content not extracted. Please use .docx, .txt or .pdf.`;
      } else {
        console.warn(`Unsupported cover letter file type: ${coverLetterFile.type}. Passing a placeholder.`);
        coverLetterTextForAi = `Cover letter provided as ${coverLetterFile.name} (type: ${coverLetterFile.type}), but its content could not be extracted as text in this step.`;
      }
    }


    const extractInput: ExtractDataFromResumeInput = {
      resumeDataUri: resumeDataUriForAi,
      coverLetterText: coverLetterTextForAi,
      onlineProfileUrl, 
      githubUrl,
    };
    const extractedData = await extractDataFromResume(extractInput) as ExtractedInformation;
    output.extractedData = extractedData;
    
    if (output.extractedData?.personalInformation) {
      if (output.extractedData.personalInformation.github === null) {
        output.extractedData.personalInformation.github = '';
      }
    }
    
    // Ensure projects.technologies is an array
    if (output.extractedData?.projects) {
      output.extractedData.projects.forEach(project => {
        if (project.technologies === null || project.technologies === undefined) {
          project.technologies = [];
        }
      });
    }

    if (!extractedData?.personalInformation?.name) {
        output.error = "Failed to extract candidate name from resume.";
        output.authenticityData.reason = "Authenticity check skipped due to data extraction error.";
        return output;
    }

    if (allJobDescriptions.length === 0) {
      output.error = "No job descriptions available in the system to match against. Please add job descriptions first.";
      output.authenticityData.reason = "Authenticity check skipped due to missing job descriptions.";
      return output;
    }

    const matchInput: MatchCandidateToJobDescriptionInput = {
      candidateSkills: extractedData.skills || [],
      candidateExperienceSummary: generateExperienceSummary(extractedData),
      availableJobDescriptions: allJobDescriptions.map(jd => ({ id: jd.id, title: jd.title, fullText: jd.fullText })),
    };
    const matchOutput = await matchCandidateToJobDescription(matchInput);

    let matchedJd: JobDescription | undefined;
    if (matchOutput.matchedJobDescriptionId) {
      matchedJd = allJobDescriptions.find(jd => jd.id === matchOutput.matchedJobDescriptionId);
      if (matchedJd) {
        output.matchedJobDescriptionId = matchedJd.id;
        output.matchedJobDescriptionTitle = matchedJd.title;
      } else {
         console.warn(`AI matched to JD ID ${matchOutput.matchedJobDescriptionId} but it was not found in the provided list.`);
      }
    }

    if (!matchedJd) {
      console.warn(`No suitable job description found for candidate ${extractedData.personalInformation.name}. Reason: ${matchOutput.matchReason}`);
    }

    let rankingData: RankingInformation | undefined;
    if (matchedJd) {
      const rankInput: RankCandidatesBySkillsInput = {
        jobDescription: matchedJd.fullText,
        candidateData: [
          {
            name: extractedData.personalInformation.name,
            skills: extractedData.skills?.join(', ') || '',
            experience: extractedData.workExperience?.map(exp => `${exp.title} at ${exp.company || 'N/A'}: ${exp.description}`).join('\n\n') || '', // Changed from .experience
          },
        ],
      };
      const rankOutput = await rankCandidatesBySkills(rankInput);
      if (rankOutput && rankOutput.length > 0) {
        rankingData = rankOutput[0];
      } else {
        console.warn("Ranking did not return expected output for:", extractedData.personalInformation.name, "against JD:", matchedJd.title);
      }
      output.rankingData = rankingData;

      if (rankingData && rankingData.ranking >= 70) { 
        try {
          const storyInput: GenerateCandidateStoryInput = {
            candidateName: extractedData.personalInformation.name,
            candidateSkills: extractedData.skills || [],
            candidateExperienceSummary: generateExperienceSummary(extractedData),
            matchedJobTitle: matchedJd.title,
            matchedJobKeyResponsibilities: matchedJd.fullText.substring(0,1000), 
            companyName: matchedJd.companyName,
          };
          const storyOutput = await generateCandidateStoryFlow(storyInput);
          output.potentialStory = storyOutput.potentialStory;
        } catch (storyError) {
           console.error('Error generating candidate potential story:', storyError);
        }
      }
    }

    const applicationTextContent = generateApplicationText(extractedData, coverLetterTextForAi, onlineProfileUrl); 
    output.applicationTextContent = applicationTextContent;

    const authenticityInput: VerifyApplicationAuthenticityInput = {
      applicationText: applicationTextContent,
      extractedEducation: extractedData.education,
      extractedExperience: extractedData.workExperience, // Changed from .experience
    };
    
    const rawAuthenticityData: VerifyApplicationAuthenticityOutput | null = await verifyApplicationAuthenticity(authenticityInput);

    if (rawAuthenticityData) {
      output.authenticityData = {
        isPotentiallyAiGenerated: Boolean(rawAuthenticityData.isPotentiallyAiGenerated),
        isPotentiallyFraudulent: Boolean(rawAuthenticityData.isPotentiallyFraudulent),
        educationSeemsGenuine: rawAuthenticityData.educationSeemsGenuine === undefined ? true : Boolean(rawAuthenticityData.educationSeemsGenuine),
        experienceSeemsGenuine: rawAuthenticityData.experienceSeemsGenuine === undefined ? true : Boolean(rawAuthenticityData.experienceSeemsGenuine),
        overallConfidenceScore:
          typeof rawAuthenticityData.overallConfidenceScore === 'number' &&
          !isNaN(rawAuthenticityData.overallConfidenceScore)
            ? rawAuthenticityData.overallConfidenceScore
            : 0, 
        reason: rawAuthenticityData.reason || "No specific reason provided by AI.",
      };
    } else {
      output.authenticityData.reason = "Authenticity check AI flow returned no conclusive data.";
    }

    const shouldDraftEmail = 
      rankingData && 
      rankingData.ranking >= 80 && 
      extractedData.personalInformation.email && 
      matchedJd?.title &&
      !(
        (output.authenticityData.isPotentiallyAiGenerated || output.authenticityData.isPotentiallyFraudulent) &&
        output.authenticityData.overallConfidenceScore > 0.6
      );

    if (shouldDraftEmail) {
      try {
        const emailInput: DraftInterviewEmailInput = {
          candidateName: extractedData.personalInformation.name,
          candidateEmail: extractedData.personalInformation.email,
          jobTitle: matchedJd.title,
          companyName: matchedJd.companyName,
        };
        const draftedEmailContent = await draftInterviewEmailFlow(emailInput);
        if (draftedEmailContent) {
             output.draftedInterviewEmail = {
              subject: draftedEmailContent.emailSubject,
              body: draftedEmailContent.emailBody,
            };
         }
      } catch (emailError) {
        console.error('Error drafting interview email:', emailError);
      }
    }


    return output;
  } catch (error) {
    console.error('Error processing application:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (output.authenticityData?.reason === "Authenticity check not performed or inconclusive.") {
        output.authenticityData.reason = "Authenticity check skipped due to processing error.";
    }
    return { ...output, error: `Processing failed: ${errorMessage}` };
  }
}

