# 🚀 AICruit

This project is an AI-powered resume analyzer built with Next.js, utilizing Google AI via Genkit for resume data extraction, candidate ranking, and authenticity verification.

## ✨ Features

- Upload resumes (DOCX, TXT, PDF])
- Extract key information from resumes
- Rank candidates based on skills and job descriptions
- Verify resume authenticity (detect potential AI generation or fraud)
- Generate potential candidate stories
- Draft interview emails based on analysis

## 🧰 Tech Stack

- Frontend: React, ShadCN UI, Tailwind CSS
- Backend: Next.js, Genkit
- Database: Firebase Firestore
- AI/ML: Google AI, Genkit
- Deployment: Vercel

## ⚙️ Setup

1.  Clone the repository:
   
bash
```
    git clone https://github.com/ngxuanhern/AICruit.git
```

2.  Navigate to the project directory:

    
bash
    ```cd AICruit```


3.  Install dependencies:

    
bash
    ```npm install```


4.  Set up Firebase:
    - Create a Firebase project.
    - Configure Firestore.
    - Add your Firebase configuration to the project (e.g., in a .env.local file).

5.  Set up Google AI/Genkit:
    - Configure your Google Cloud project and credentials for Genkit.
    - Ensure necessary APIs are enabled.

6.  Run the development server:

    
bash
    ```npm run dev```


    Open http://localhost:3000 with your browser to see the result.
7. Try our deployed version.
   https://ai-cruit-1.vercel.app
   
## 🗂️ Project Structure

- src/app: Next.js application routes.
- src/components: Reusable UI components.
- src/lib: Helper functions, types, and API actions (including resume processing).
- src/ai/flows: Genkit AI flows for data extraction, ranking, etc.
  
## 👥 Team Members
Ng Xuan Hern, Low Yvonne
