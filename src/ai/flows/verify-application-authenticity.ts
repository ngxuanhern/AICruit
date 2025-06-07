
'use server';
/**
 * @fileOverview Verifies the authenticity of an application, checking for signs of AI generation,
 * fraudulent indicators, and the plausibility of listed education and work experience.
 * It uses a tool to help verify the existence of educational institutions.
 *
 * - verifyApplicationAuthenticity - A function that verifies application authenticity.
 * - VerifyApplicationAuthenticityInput - The input type for the function.
 * - VerifyApplicationAuthenticityOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractedEducationSchema = z.object({
  degree: z.string().describe('The degree obtained.'),
  institution: z.string().describe('The name of the institution.'),
  dates: z.string().nullable().optional().describe('The start and end dates of attendance. Can be null or omitted if not available or not clearly specified.'),
});

const ExtractedExperienceSchema = z.object({
  title: z.string().describe('The job title.'),
  company: z.string().nullable().optional().describe('The company name. Can be null or omitted if not applicable (e.g., for projects).'),
  dates: z.string().nullable().optional().describe('The start and end dates of employment. Can be null or omitted if not available or not clearly specified.'),
  description: z.string().describe('A description of the job responsibilities and achievements.'),
});


const VerifyApplicationAuthenticityInputSchema = z.object({
  applicationText: z
    .string()
    .describe('The full text of the application (e.g., concatenated resume, cover letter) to be checked for general authenticity and AI generation.'),
  extractedEducation: z
    .array(ExtractedEducationSchema)
    .optional()
    .describe("Structured list of the candidate's education history. Used to verify genuineness of institutions."),
  extractedExperience: z
    .array(ExtractedExperienceSchema)
    .optional()
    .describe("Structured list of the candidate's work experiences. Used to verify genuineness of companies."),
});
export type VerifyApplicationAuthenticityInput = z.infer<typeof VerifyApplicationAuthenticityInputSchema>;

const VerifyApplicationAuthenticityOutputSchema = z.object({
  isPotentiallyAiGenerated: z
    .boolean()
    .describe('Whether the application text shows strong signs of being AI-generated.'),
  isPotentiallyFraudulent: z
    .boolean()
    .describe('Whether the application shows overall signs of being fraudulent, fabricated, or containing significant misrepresentations (e.g., inconsistent timelines, unrealistic claims, suspicious education/experience). This is a summary flag based on holistic assessment.'),
  educationSeemsGenuine: z
    .boolean()
    .describe('Whether ALL listed educational institutions seem to be real and legitimate. This is determined by using the verifySchoolExistenceTool. True if all verified or no education provided, false if any institution is flagged by the tool.'),
  experienceSeemsGenuine: z
    .boolean()
    .describe('Whether the listed companies in work experience seem to be real and legitimate based on general knowledge. True if genuine or not enough info to flag, false if suspicious.'),
  overallConfidenceScore: z
    .number()
    .min(0).max(1)
    .describe("An overall confidence score (0.0 to 1.0) reflecting the AI's confidence in the most significant negative finding (AI generation or fraud). If 'isPotentiallyAiGenerated' is true OR 'isPotentiallyFraudulent' is true, this score SHOULD reflect that confidence. If all flags are false, this score should be 0.0 or very close to it."),
  reason: z
    .string()
    .describe('A detailed explanation for the assessments, covering AI generation, general fraudulent aspects, and specific comments on education/experience genuineness if flagged. If not flagged, state that it appears genuine. Must include notes from school verification tool if used.'),
});
export type VerifyApplicationAuthenticityOutput = z.infer<typeof VerifyApplicationAuthenticityOutputSchema>;


// Tool to verify school existence (simulated)
const verifySchoolExistenceTool = ai.defineTool(
  {
    name: 'verifySchoolExistenceTool',
    description: 'Checks if a given institution name likely refers to a real educational institution. Returns whether it is known and provides verification notes.',
    inputSchema: z.object({
      institutionName: z.string().describe('The name of the educational institution to verify.'),
    }),
    outputSchema: z.object({
      isKnownInstitution: z.boolean().describe('True if the institution seems legitimate, false otherwise.'),
      verificationNotes: z.string().describe('Notes on why the institution was considered known or not.'),
    }),
  },
  async ({ institutionName }) => {
    const name = institutionName.toLowerCase().trim();
    const knownKeywords = ["university", "college", "institute", "polytechnic", "school of", "academy of", "faculty of"];
    const suspiciousKeywords = ["test school", "fake university", "example institution", "my own school"];
    const veryGenericTerms = ["academy", "center", "program", "school"]; 

    if (!name) {
        return { isKnownInstitution: false, verificationNotes: `Institution name is empty.` };
    }
    if (suspiciousKeywords.some(keyword => name.includes(keyword))) {
      return { isKnownInstitution: false, verificationNotes: `Institution name '${institutionName}' contains suspicious keywords (e.g., 'test', 'fake').` };
    }

    if (knownKeywords.some(keyword => name.includes(keyword))) {
      if ((name.includes("academy") || name.includes("school")) && name.split(" ").length < 3 && !name.includes(" of ")) {
         if (!knownKeywords.some(kw => name.includes(kw) && !["academy", "school", "school of", "academy of"].includes(kw))) { 
            return { isKnownInstitution: false, verificationNotes: `Institution name '${institutionName}' like 'X Academy' or 'Y School' is generic without further specification (e.g., 'University of X', 'X State College', 'Academy of Sciences').` };
         }
      }
      return { isKnownInstitution: true, verificationNotes: `Institution name '${institutionName}' contains standard institutional keywords and seems plausible.` };
    }

    if (name.split(" ").length < 2 && !knownKeywords.some(keyword => name.includes(keyword))) {
        return { isKnownInstitution: false, verificationNotes: `Institution name '${institutionName}' is very short and lacks common institutional keywords.` };
    }
    
    return { isKnownInstitution: false, verificationNotes: `Institution name '${institutionName}' does not strongly match patterns of known institutional names (e.g., missing 'University', 'College', 'Institute'). Further scrutiny advised.` };
  }
);


export async function verifyApplicationAuthenticity(
  input: VerifyApplicationAuthenticityInput
): Promise<VerifyApplicationAuthenticityOutput> {
  return verifyApplicationAuthenticityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'verifyApplicationAuthenticityPrompt',
  input: {schema: VerifyApplicationAuthenticityInputSchema},
  output: {schema: VerifyApplicationAuthenticityOutputSchema},
  tools: [verifySchoolExistenceTool], 
  prompt: `You are an expert in identifying potentially problematic job applications. You will analyze the provided application data for several aspects:
1.  Signs of AI-generated content in the 'applicationText'.
2.  The genuineness of educational institutions listed in 'extractedEducation' (if provided), using the 'verifySchoolExistenceTool'.
3.  The genuineness of company names listed in 'extractedExperience' (if provided), using your general knowledge.
4.  General signs of fraudulent or fabricated content.

Input Data:
Application Text (for overall analysis and AI generation detection):
{{{applicationText}}}

{{#if extractedEducation}}
Extracted Education History:
{{#each extractedEducation}}
- Institution: {{{institution}}}, Degree: {{{degree}}}, Dates: {{#if dates}}{{{dates}}}{{else}}Not Specified{{/if}}
{{/each}}
(Instruction to AI for Education: For EACH institution listed above, you MUST use the 'verifySchoolExistenceTool' by providing the 'institutionName'.
Set the 'educationSeemsGenuine' output field to 'false' if the tool returns 'isKnownInstitution: false' for ANY of the institutions. Otherwise, set it to 'true'.
In the 'reason' output field, you MUST include the 'verificationNotes' from the tool for each institution, especially if it was flagged as not known.)
{{else}}
(No education data provided for verification.)
{{/if}}

{{#if extractedExperience}}
Extracted Work Experience (for company verification - use general knowledge):
{{#each extractedExperience}}
- Company: {{#if company}}{{{company}}}{{else}}Not Specified{{/if}}, Title: {{{title}}}, Dates: {{#if dates}}{{{dates}}}{{else}}Not Specified{{/if}}
{{/each}}
(Instruction to AI for Experience: Assess if company names sound like real, known entities or fabricated, using your general knowledge. Set 'experienceSeemsGenuine' accordingly.)
{{else}}
(No experience data provided for company verification.)
{{/if}}

Based on your analysis and tool usage, output a JSON object with the following fields:
- isPotentiallyAiGenerated: (boolean) True if 'applicationText' shows strong signs of being AI-generated (e.g., overly generic, specific phrasing patterns).
- educationSeemsGenuine: (boolean) Determined by the 'verifySchoolExistenceTool'. True if all institutions verified or no education provided; false if any flagged by the tool.
- experienceSeemsGenuine: (boolean) True if all listed companies in work experience appear legitimate (based on general knowledge) or if no experience data was provided. False if any company seems clearly fabricated or highly suspicious.
- isPotentiallyFraudulent: (boolean) Assess if the application shows overall signs of being fraudulent, fabricated, or containing significant misrepresentations.
  Consider the following:
    - General fraudulent indicators in 'applicationText' (e.g., blatant inconsistencies, absurd claims, copied content if detectable).
    - If 'educationSeemsGenuine' is false (based on tool output), treat this as a strong warning sign that contributes to potential fraud, especially if multiple institutions are flagged or if the flagged institution is for a primary degree.
    - If 'experienceSeemsGenuine' is false (e.g., listed companies seem clearly fabricated), treat this as a strong warning sign.
  Set to 'true' if there's a notable concern of intentional deceit or significant fabrication. A single unverified school for a minor certification, if other aspects are fine, might not automatically trigger this flag.
  This is an overall fraud assessment.
- overallConfidenceScore: (number 0.0-1.0) Your confidence in the *most significant negative finding*.
    - If 'isPotentiallyAiGenerated' is true, this score reflects your confidence in that AI generation assessment.
    - If 'isPotentiallyFraudulent' is true, this score reflects your confidence in the fraud assessment (considering its components).
    - If both are true, use the higher confidence or a combined confidence if appropriate.
    - If multiple factors contribute to 'isPotentiallyFraudulent' (e.g., suspicious education AND experience), the confidence should reflect the combined weight.
    - If all flags (AI-generated, fraudulent) are false, this score should be very low (e.g., < 0.1).
    - A score > 0.6 indicates a strong concern.
- reason: (string) Detailed explanation covering AI generation, general fraud indicators. CRITICALLY, it MUST include the 'verificationNotes' from the 'verifySchoolExistenceTool' for each checked institution and specific comments on company genuineness if experience is flagged. If all checks pass, state it appears genuine.
`,
});

const verifyApplicationAuthenticityFlow = ai.defineFlow(
  {
    name: 'verifyApplicationAuthenticityFlow',
    inputSchema: VerifyApplicationAuthenticityInputSchema,
    outputSchema: VerifyApplicationAuthenticityOutputSchema,
  },
  async (input): Promise<VerifyApplicationAuthenticityOutput> => {
    const {output} = await prompt(input);

    if (!output) {
      console.warn('VerifyApplicationAuthenticity prompt returned null output. Returning default error state.');
      return {
        isPotentiallyAiGenerated: false,
        isPotentiallyFraudulent: true, 
        educationSeemsGenuine: !(input.extractedEducation && input.extractedEducation.length > 0),
        experienceSeemsGenuine: !(input.extractedExperience && input.extractedExperience.length > 0),
        overallConfidenceScore: 0.5, 
        reason: "AI could not process the application for authenticity verification. This may be due to an internal AI error or an issue with the input data format preventing analysis. Please review manually.",
      };
    }

    const result = output; 

    let educationGenuine = true; 
    if (input.extractedEducation && input.extractedEducation.length > 0) {
        educationGenuine = result.educationSeemsGenuine === undefined ? true : Boolean(result.educationSeemsGenuine);
    }
    
    let experienceGenuine = true;
    if (input.extractedExperience && input.extractedExperience.length > 0) {
        experienceGenuine = result.experienceSeemsGenuine === undefined ? true : Boolean(result.experienceSeemsGenuine);
    }

    return {
      isPotentiallyAiGenerated: Boolean(result.isPotentiallyAiGenerated),
      isPotentiallyFraudulent: Boolean(result.isPotentiallyFraudulent),
      educationSeemsGenuine: educationGenuine,
      experienceSeemsGenuine: experienceGenuine,
      overallConfidenceScore: typeof result.overallConfidenceScore === 'number' && !isNaN(result.overallConfidenceScore) ? result.overallConfidenceScore : 0.0,
      reason: result.reason || "No specific reason provided by AI.",
    };
  }
);

