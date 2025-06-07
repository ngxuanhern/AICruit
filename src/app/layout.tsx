
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { CandidateProvider } from '@/context/CandidateContext';
import { JobDescriptionProvider } from '@/context/JobDescriptionContext';
import { AuthProvider } from '@/context/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';

export const metadata: Metadata = {
  title: 'AICruit - AI Talent Acquisition',
  description: 'AI-powered talent acquisition system by AICruit',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/faviconai.png" type="image/png" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <CandidateProvider>
            <JobDescriptionProvider>
              <MainLayout>{children}</MainLayout>
              <Toaster />
            </JobDescriptionProvider>
          </CandidateProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
