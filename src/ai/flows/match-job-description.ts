
'use server';
/**
 * @fileOverview Matches a candidate to the most suitable job description from a list.
 *
 * - matchCandidateToJobDescription - A function that handles the job description matching process.
 * - MatchCandidateToJobDescriptionInput - The input type for the function.
 * - MatchCandidateToJobDescriptionOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const JobDescriptionLiteSchema = z.object({
  id: z.string().describe('Unique identifier for the job description.'),
  title: z.string().describe('The title of the job.'),
  fullText: z.string().describe('The full text of the job description.'),
});

const MatchCandidateToJobDescriptionInputSchema = z.object({
  candidateSkills: z.array(z.string()).describe('A list of skills extracted from the candidate\'s resume.'),
  candidateExperienceSummary: z.string().describe('A brief summary of the candidate\'s work experience.'),
  availableJobDescriptions: z.array(JobDescriptionLiteSchema).describe('A list of available job descriptions to match against.'),
});
export type MatchCandidateToJobDescriptionInput = z.infer<typeof MatchCandidateToJobDescriptionInputSchema>;

const MatchCandidateToJobDescriptionOutputSchema = z.object({
  matchedJobDescriptionId: z.string().nullable().describe('The ID of the best matching job description. Null if no suitable match is found.'),
  matchConfidence: z.number().min(0).max(1).describe('A confidence score (0-1) for the match. 0 if no match.'),
  matchReason: z.string().describe('The reasoning behind the match or why no match was found.'),
});
export type MatchCandidateToJobDescriptionOutput = z.infer<typeof MatchCandidateToJobDescriptionOutputSchema>;

export async function matchCandidateToJobDescription(input: MatchCandidateToJobDescriptionInput): Promise<MatchCandidateToJobDescriptionOutput> {
  return matchCandidateToJobDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'matchCandidateToJobDescriptionPrompt',
  input: {schema: MatchCandidateToJobDescriptionInputSchema},
  output: {schema: MatchCandidateToJobDescriptionOutputSchema},
  prompt: `You are an expert recruitment assistant. Your task is to match a candidate to the most suitable job description from a provided list.

Candidate Profile:
Skills:
{{#each candidateSkills}}
- {{{this}}}
{{/each}}

Experience Summary:
{{{candidateExperienceSummary}}}

Available Job Descriptions:
{{#each availableJobDescriptions}}
---
Job ID: {{{id}}}
Job Title: {{{title}}}
Description:
{{{fullText}}}
---
{{/each}}

Analyze the candidate's skills and experience against each job description.
Determine which job description is the best fit.
If a suitable match is found, provide its ID, a confidence score (0.0 to 1.0, where 1.0 is a perfect match), and a brief reason.
If no job description is a reasonably good fit (e.g., confidence below 0.6), return null for the ID, 0 for confidence, and explain why no suitable match was found.
Consider keywords, required experience levels, and overall role alignment.

Output your response in the specified JSON format.
`,
});

const matchCandidateToJobDescriptionFlow = ai.defineFlow(
  {
    name: 'matchCandidateToJobDescriptionFlow',
    inputSchema: MatchCandidateToJobDescriptionInputSchema,
    outputSchema: MatchCandidateToJobDescriptionOutputSchema,
  },
  async input => {
    if (input.availableJobDescriptions.length === 0) {
      return {
        matchedJobDescriptionId: null,
        matchConfidence: 0,
        matchReason: 'No job descriptions were available to match against.',
      };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
