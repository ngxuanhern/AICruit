'use server';
/**
 * @fileOverview Generates a brief "potential story" for a candidate.
 *
 * - generateCandidateStory - A function that handles generating the story.
 * - GenerateCandidateStoryInput - The input type for the function.
 * - GenerateCandidateStoryOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCandidateStoryInputSchema = z.object({
  candidateName: z.string().describe('The full name of the candidate.'),
  candidateSkills: z.array(z.string()).describe("A list of the candidate's key skills."),
  candidateExperienceSummary: z.string().describe("A brief summary of the candidate's work experience."),
  matchedJobTitle: z.string().describe('The title of the job the candidate is matched with.'),
  matchedJobKeyResponsibilities: z.string().describe('Key responsibilities of the matched job.'),
  companyName: z.string().describe('The name of the hiring company.'),
});
export type GenerateCandidateStoryInput = z.infer<typeof GenerateCandidateStoryInputSchema>;

const GenerateCandidateStoryOutputSchema = z.object({
  potentialStory: z.string().describe('A brief, optimistic narrative (2-4 sentences) highlighting the candidate\'s potential fit, unique strengths, and possible impact or growth in the context of the matched job and company. It should be engaging and forward-looking.'),
});
export type GenerateCandidateStoryOutput = z.infer<typeof GenerateCandidateStoryOutputSchema>;

export async function generateCandidateStory(input: GenerateCandidateStoryInput): Promise<GenerateCandidateStoryOutput> {
  return generateCandidateStoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCandidateStoryPrompt',
  input: {schema: GenerateCandidateStoryInputSchema},
  output: {schema: GenerateCandidateStoryOutputSchema},
  prompt: `You are an expert talent storyteller and recruitment strategist for {{{companyName}}}.
Your task is to craft a brief, optimistic, and engaging "potential story" (2-4 sentences) for a candidate based on their profile and a matched job. This story should help recruiters and hiring managers see beyond a list of qualifications and envision the candidate's potential impact and growth.

Candidate Name: {{{candidateName}}}
Candidate Key Skills: {{#each candidateSkills}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
Candidate Experience Summary: {{{candidateExperienceSummary}}}

Matched Job Title: {{{matchedJobTitle}}}
Matched Job Key Responsibilities: {{{matchedJobKeyResponsibilities}}}

Based on this information, generate a "potentialStory". Focus on:
- Highlighting 1-2 key strengths or experiences of the candidate that align with the job.
- Suggesting how they might contribute uniquely or grow within the role at {{{companyName}}}.
- Maintaining a positive, professional, and forward-looking tone.
- Avoid making definitive claims; use words like "could," "potential," "may," "suggests."
- Ensure the story is concise and impactful.

Example (for a different candidate/role):
"Jane's background in project management combined with her recent certification in Agile methodologies suggests she could quickly streamline our development cycles for the Senior Scrum Master role. Her experience at TechCorp, particularly in leading cross-functional teams, indicates strong potential to foster collaboration and drive project success at {{{companyName}}}."

Generate only the 'potentialStory' field.
`,
});

const generateCandidateStoryFlow = ai.defineFlow(
  {
    name: 'generateCandidateStoryFlow',
    inputSchema: GenerateCandidateStoryInputSchema,
    outputSchema: GenerateCandidateStoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
