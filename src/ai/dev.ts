
import { config } from 'dotenv';
config();

import '@/ai/flows/rank-candidates-by-skills.ts';
import '@/ai/flows/verify-application-authenticity.ts'; // Updated from flag-potentially-ai-generated-applications.ts
import '@/ai/flows/extract-data-from-resume.ts';
import '@/ai/flows/match-job-description.ts'; 
import '@/ai/flows/draft-interview-email.ts';
import '@/ai/flows/generate-candidate-story.ts'; // Added new flow

