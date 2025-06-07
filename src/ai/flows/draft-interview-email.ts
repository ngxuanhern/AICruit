
'use server';
/**
 * @fileOverview Drafts an interview invitation email for a candidate.
 *
 * - draftInterviewEmail - A function that handles drafting the email.
 * - DraftInterviewEmailInput - The input type for the function.
 * - DraftInterviewEmailOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DraftInterviewEmailInputSchema = z.object({
  candidateName: z.string().describe('The full name of the candidate.'),
  candidateEmail: z.string().describe('The email address of the candidate.'),
  jobTitle: z.string().describe('The job title for which the candidate is being invited to interview.'),
  companyName: z.string().describe('The name of the company sending the invitation.'),
});
export type DraftInterviewEmailInput = z.infer<typeof DraftInterviewEmailInputSchema>;

const DraftInterviewEmailOutputSchema = z.object({
  emailSubject: z.string().describe("The subject line for the interview invitation email, formatted as 'Interview Invitation: [Job Title] at [Company Name]'."),
  emailBody: z.string().describe('The full body content of the interview invitation email. It should be professional, friendly, and include placeholders like [Interviewer Name], [Date/Time Options], [Video Call Link/Location].'),
});
export type DraftInterviewEmailOutput = z.infer<typeof DraftInterviewEmailOutputSchema>;

export async function draftInterviewEmail(input: DraftInterviewEmailInput): Promise<DraftInterviewEmailOutput> {
  return draftInterviewEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'draftInterviewEmailPrompt',
  input: {schema: DraftInterviewEmailInputSchema},
  output: {schema: DraftInterviewEmailOutputSchema},
  prompt: `You are an expert HR assistant tasked with drafting an interview invitation email.

Company Name: {{{companyName}}}
Candidate Name: {{{candidateName}}}
Candidate Email: {{{candidateEmail}}}
Job Title: {{{jobTitle}}}

Draft a professional and friendly email to the candidate. The email should:
1.  Congratulate them on being selected for an interview.
2.  Clearly state the job title they are being interviewed for.
3.  Express enthusiasm about their application.
4.  Propose the next steps, which typically involve scheduling the interview.
5.  Include placeholders for logistical details that the recruiter will fill in later, such as:
    *   [Interviewer Name(s) and Title(s)]
    *   [Available Date/Time Options] or a link to a scheduling tool.
    *   [Interview Duration, e.g., 45 minutes]
    *   [Video Call Link/Physical Location]
    *   [Any preparation instructions, if applicable]
6.  Conclude with a positive note and contact information for questions.

The subject line for the email MUST be formatted as: "Interview Invitation: {{{jobTitle}}} at {{{companyName}}}".
Generate this subject line and the full email body.
`,
});

const draftInterviewEmailFlow = ai.defineFlow(
  {
    name: 'draftInterviewEmailFlow',
    inputSchema: DraftInterviewEmailInputSchema,
    outputSchema: DraftInterviewEmailOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
