'use server';
/**
 * @fileOverview Ranks candidates based on their skills and experience relative to the job description.
 *
 * - rankCandidatesBySkills - A function that ranks candidates based on skills and experience.
 * - RankCandidatesBySkillsInput - The input type for the rankCandidatesBySkills function.
 * - RankCandidatesBySkillsOutput - The return type for the rankCandidatesBySkills function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RankCandidatesBySkillsInputSchema = z.object({
  jobDescription: z.string().describe('The job description to match candidates against.'),
  candidateData: z.array(
    z.object({
      name: z.string().describe('The name of the candidate.'),
      skills: z.string().describe('A comma-separated list of skills the candidate possesses.'),
      experience: z.string().describe('A summary of the candidate\'s relevant work experience.'),
    })
  ).describe('An array of candidate data objects.'),
});
export type RankCandidatesBySkillsInput = z.infer<typeof RankCandidatesBySkillsInputSchema>;

const RankCandidatesBySkillsOutputSchema = z.array(
  z.object({
    name: z.string().describe('The name of the candidate.'),
    ranking: z.number().describe('A numerical ranking (0-100) of how well the candidate matches the job description.'),
    reason: z.string().describe('The reasoning behind the ranking.'),
  })
);
export type RankCandidatesBySkillsOutput = z.infer<typeof RankCandidatesBySkillsOutputSchema>;

export async function rankCandidatesBySkills(input: RankCandidatesBySkillsInput): Promise<RankCandidatesBySkillsOutput> {
  return rankCandidatesBySkillsFlow(input);
}

const rankCandidatesPrompt = ai.definePrompt({
  name: 'rankCandidatesPrompt',
  input: {schema: RankCandidatesBySkillsInputSchema},
  output: {schema: RankCandidatesBySkillsOutputSchema},
  prompt: `You are an expert talent acquisition specialist. Given a job description and a list of candidates with their skills and experience, rank the candidates based on how well they match the job description. Provide a ranking from 0 to 100 and a brief explanation for each candidate's ranking.

Job Description: {{{jobDescription}}}

Candidates:
{{#each candidateData}}
Name: {{{name}}}
Skills: {{{skills}}}
Experience: {{{experience}}}
---
{{/each}}

Format your response as a JSON array of objects, where each object has the candidate's name, a numerical ranking (0-100), and a reason for the ranking.
`,
});

const rankCandidatesBySkillsFlow = ai.defineFlow(
  {
    name: 'rankCandidatesBySkillsFlow',
    inputSchema: RankCandidatesBySkillsInputSchema,
    outputSchema: RankCandidatesBySkillsOutputSchema,
  },
  async input => {
    const {output} = await rankCandidatesPrompt(input);
    return output!;
  }
);
