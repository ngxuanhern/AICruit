
'use server';
/**
 * @fileOverview Extracts and consolidates candidate data from diverse, often unstructured sources
 * like resumes, cover letters, and online profiles. It aims to standardize these varied inputs
 * into a consistent, high-quality JSON format, ensuring data fidelity and enabling robust
 * downstream processing for talent acquisition.
 * It utilizes an LLM for advanced NLP tasks and leverages tools to enrich the extracted data,
 * such as looking up company industry information and simulating the analysis of online profiles.
 *
 * - extractDataFromResume - A function that handles the data extraction and consolidation.
 * - ExtractDataFromResumeInput - The input type for the extractDataFromResume function.
 * - ExtractDataFromResumeOutput - The return type for the extractDataFromResume function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractDataFromResumeInputSchema = z.object({
  resumeDataUri: z
    .string()
    .describe(
      "The resume file data, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  coverLetterText: z
    .string()
    .optional()
    .describe("The full text content of the candidate's cover letter, if available."),
  onlineProfileUrl: z
    .string()
    .url()
    .optional()
    .describe("The URL of the candidate's online professional profile (e.g., LinkedIn). If provided, a tool will attempt to simulate fetching and analyzing its content."),
  githubUrl: z
    .string()
    .url()
    .optional()
    .describe("The URL of the candidate's GitHub profile. If provided, it will be included in the extracted information."),
});
export type ExtractDataFromResumeInput = z.infer<typeof ExtractDataFromResumeInputSchema>;

// Define schemas for Work Experience and Projects separately
const ExtractedExperienceSchema = z.object({
  title: z.string().describe('The job title.'),
  company: z.string().describe('The company name.'),
  dates: z
    .string()
    .nullable()
    .optional()
    .describe('The start and end dates of employment.'),
  description: z.string().describe('A description of the job responsibilities and achievements.'),
  industry: z.string().nullable().optional().describe('The primary industry of the company, if found or looked up by a tool.'),
});

const ExtractedProjectSchema = z.object({
  name: z.string().describe('The project name.'),
  role: z.string().nullable().optional().describe('The candidate\'s role in the project.'),
        dates: z
          .string()
          .nullable()
          .optional()
    .describe('The project duration.'),
  description: z.string().describe('A description of the project, including goals and outcomes.'),
  technologies: z.array(z.string()).nullable().optional().default([]).describe('A list of technologies used in the project. Defaults to an empty array if null or not provided.'),
});
const ExtractedEducationSchema = z.object({
        degree: z.string().describe('The degree obtained.'),
        institution: z.string().describe('The name of the institution.'),
        dates: z
          .string()
          .nullable()
          .optional()
    .describe('The start and end dates of attendance.'),
});
const ExtractDataFromResumeOutputSchema = z.object({
  personalInformation: z.object({
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    linkedin: z.string().optional(),
    github: z.string().optional(),
  }),
  workExperience: z.array(ExtractedExperienceSchema), 
  projects: z.array(ExtractedProjectSchema),       
  education: z.array(ExtractedEducationSchema),
  skills: z.array(z.string()),
});
export type ExtractDataFromResumeOutput = z.infer<typeof ExtractDataFromResumeOutputSchema>;

// Define a tool for getting company information
const getCompanyInfoTool = ai.defineTool(
  {
    name: 'getCompanyInfo',
    description: 'Provides additional information about a company, such as its primary industry. Use this tool if you need to find out the industry for a company listed in work experience.',
    inputSchema: z.object({ companyName: z.string().describe('The name of the company to look up.') }),
    outputSchema: z.object({ industry: z.string().describe('The primary industry of the company. Returns "Unknown" if not found.') }),
  },
  async ({ companyName }) => {
    // In a real scenario, this would call an external API or database.
    // This is a placeholder implementation.
    if (companyName.toLowerCase().includes('google') || companyName.toLowerCase().includes('microsoft') || companyName.toLowerCase().includes('facebook') || companyName.toLowerCase().includes('amazon') || companyName.toLowerCase().includes('apple')) {
      return { industry: 'Technology' };
    }
    if (companyName.toLowerCase().includes('accenture') || companyName.toLowerCase().includes('deloitte')) {
      return { industry: 'Consulting' };
    }
    if (companyName.toLowerCase().includes('hospital') || companyName.toLowerCase().includes('health')) {
      return { industry: 'Healthcare' };
    }
    return { industry: 'Unknown Industry' }; 
  }
);

// Define a tool for simulating online profile data fetching
const SimulatedOnlineProfileDataSchema = z.object({
    profileType: z.string().describe("The inferred type of the online profile (e.g., LinkedIn, GitHub, Personal Portfolio, Unknown)."),
    possibleHeadline: z.string().optional().describe("A plausible job title or headline that might be found on such a profile."),
    keySkills: z.array(z.string()).optional().describe("A list of common skills often found on this type of profile."),
    summaryPoints: z.array(z.string()).optional().describe("A few key points or phrases that might appear in a summary section on such a profile."),
});

const getSimulatedOnlineProfileDataTool = ai.defineTool(
  {
    name: 'getSimulatedOnlineProfileData',
    description: 'Analyzes a given online profile URL (e.g., LinkedIn, GitHub) and returns simulated, plausible data points like profile type, potential headline, common skills, and summary points. Does not actually fetch live data from the URL.',
    inputSchema: z.object({ onlineProfileUrl: z.string().url().describe("The URL of the candidate's online professional profile.") }),
    outputSchema: SimulatedOnlineProfileDataSchema,
  },
  async ({ onlineProfileUrl }) => {
    const url = onlineProfileUrl.toLowerCase();
    if (url.includes('linkedin.com/in/')) {
      return {
        profileType: 'LinkedIn',
        possibleHeadline: 'Experienced Professional | Seeking New Opportunities',
        keySkills: ['Project Management', 'Data Analysis', 'Communication', 'Team Leadership'],
        summaryPoints: [
          'Results-oriented professional with X years of experience.',
          'Proven ability to manage complex projects and deliver results.',
          'Strong analytical and problem-solving skills.',
        ],
      };
    }
    if (url.includes('github.com/')) {
      return {
        profileType: 'GitHub',
        possibleHeadline: 'Software Developer | Open Source Contributor',
        keySkills: ['JavaScript', 'Python', 'Git', 'React', 'Node.js'],
        summaryPoints: [
          'Passionate developer with a focus on building scalable web applications.',
          'Contributor to several open-source projects.',
          'Proficient in various programming languages and frameworks.',
        ],
      };
    }
    if (url.startsWith('http')) {
        return {
            profileType: 'Personal Portfolio/Other',
            possibleHeadline: 'Creative Professional',
            keySkills: ['Design', 'Content Creation', 'Marketing'],
            summaryPoints: ['Showcasing a collection of work and projects.'],
        };
    }
    return {
      profileType: 'Unknown',
      possibleHeadline: undefined,
      keySkills: [],
      summaryPoints: [],
    };
  }
);


export async function extractDataFromResume(input: ExtractDataFromResumeInput): Promise<ExtractDataFromResumeOutput> {
  return extractDataFromResumeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractAndConsolidateCandidateDataPrompt',
  input: {schema: ExtractDataFromResumeInputSchema},
  output: {schema: ExtractDataFromResumeOutputSchema},
  tools: [getCompanyInfoTool, getSimulatedOnlineProfileDataTool], 
  prompt: `You are an expert resume and professional profile parser. Your job is to extract information from the provided documents (resume, and optionally cover letter text, an online profile URL, and a specific GitHub URL) and format it into a structured JSON output.

The resume is the primary source of information. Use the cover letter text (if provided) to supplement or corroborate details.

Resume Data:
{{media url=resumeDataUri}}

{{#if coverLetterText}}
---
Cover Letter Text:
{{{coverLetterText}}}
---
{{/if}}

{{#if onlineProfileUrl}}
---
Online Profile URL: {{{onlineProfileUrl}}}
(Instruction to AI: If an 'onlineProfileUrl' is provided, you MUST first use the 'getSimulatedOnlineProfileData' tool to get simulated structured information about the likely content of such a profile.
Then, use the data returned by this tool *in conjunction with* the resume and cover letter to supplement, corroborate, or find additional details for the main output fields.
For example, if the tool returns 'keySkills', add them to the main 'skills' list if they aren't already present from the resume.
If it suggests a 'possibleHeadline' and the resume is unclear on a current role, this might help.
The tool's output for 'profileType' will be important for populating LinkedIn/GitHub URLs in Personal Information (see instructions below).)
---
{{/if}}

{{#if githubUrl}}
---
Explicitly Provided GitHub URL: {{{githubUrl}}}
(Instruction to AI: This is a specific GitHub URL provided for the candidate. You should strongly prioritize this for the 'personalInformation.github' field in your output. See detailed instructions under 'Personal Information' extraction.)
---
{{/if}}

Based on all the information provided (resume, cover letter text, data from the online profile URL tool, and any explicitly provided GitHub URL), extract and structure the data according to the output schema. Pay close attention to separating Work Experience from Projects.

**Work Experience**: Extract entries that represent traditional paid employment or significant internships. Look for sections titled "Work Experience", "Professional Experience", "Employment History", etc. These entries should have a company name, job title, and dates of employment. Populate the \`workExperience\` array.

**Projects**: Extract entries that represent personal projects, academic projects, or significant contributions to open-source projects. Look for sections titled "Projects", "Personal Projects", "Portfolio", etc., or infer from context where a company name is absent or the description clearly indicates a project rather than a job. These entries should have a project name, potentially a role, dates, description, and technologies used. Populate the \`projects\` array. For projects, the 'company' field should be null or omitted in the output JSON if there isn't a specific company associated with it (like a client name for freelance or consulting projects). If no technologies are listed for a project, provide an empty array for the 'technologies' field rather than null.

Focus on extracting the following details for each section:

- Personal Information:
  - Full Name: (Extract from resume/cover letter)
  - Email: (Extract from resume/cover letter)
  - Phone number: (Extract from resume/cover letter)
  - LinkedIn URL:
    1.  Look for a LinkedIn URL directly in the resume or cover letter.
    2.  If not found, and if '{{{onlineProfileUrl}}}' was provided AND the 'getSimulatedOnlineProfileData' tool identified its 'profileType' as 'LinkedIn', then use '{{{onlineProfileUrl}}}' as the LinkedIn URL.
    3.  If no LinkedIn URL is found from these sources, this field can be omitted.
  - GitHub URL:
    1.  **Primary Source:** If an 'Explicitly Provided GitHub URL' (i.e., '{{{githubUrl}}}') is available and is a valid URL, YOU MUST use this value for 'personalInformation.github'.
    2.  **Secondary Source (Online Profile):** If no 'Explicitly Provided GitHub URL' was given (or if it was empty/invalid), AND if '{{{onlineProfileUrl}}}' was provided AND the 'getSimulatedOnlineProfileData' tool identified its 'profileType' as 'GitHub', then use '{{{onlineProfileUrl}}}' for 'personalInformation.github'.
    3.  **Tertiary Source (Documents):** If no GitHub URL was obtained from the above, search for a GitHub URL within the resume or cover letter text.
    4.  If no GitHub URL is found from any source, the 'github' field in 'personalInformation' should be omitted from the JSON output (do not set to null or empty string).
- Work Experience: Job Title, Company Name, Dates, Description, and Industry (use the 'getCompanyInfo' tool for each company name extracted to find its industry).
- Projects: Project Name, Role, Dates, Description, and Technologies (ensure 'technologies' is an empty array [] if none are present, not null).
- Education: Degree, Institution, and Dates.
- Skills: A comprehensive list of all technical and soft skills mentioned.

Ensure the output strictly adheres to the \`ExtractDataFromResumeOutputSchema\`.

Output JSON:
`,
});

const extractDataFromResumeFlow = ai.defineFlow(
  {
    name: 'extractDataFromResumeFlow',
    inputSchema: ExtractDataFromResumeInputSchema,
    outputSchema: ExtractDataFromResumeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

