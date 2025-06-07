
"use client";

import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { AppShell } from './AppShell';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loadingAuth } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const publicPaths = ['/', '/login', '/signup'];
  const isPublicPage = publicPaths.includes(pathname);
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  useEffect(() => {
    if (!loadingAuth && !user && !isPublicPage) {
      router.push('/login');
    }
    if (!loadingAuth && user && isAuthPage) {
      router.push('/dashboard'); // If user is logged in and tries to access /login or /signup, redirect to dashboard
    }
  }, [user, loadingAuth, isPublicPage, isAuthPage, router, pathname]);

  if (loadingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <LoadingSpinner size={48} />
        <p className="ml-4 text-lg">Loading AICruit...</p>
      </div>
    );
  }

  if (!user && !isPublicPage) {
    // This case should ideally be handled by the redirect, but as a fallback during transition:
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-foreground">
        <LoadingSpinner size={48} />
        <p className="ml-4 text-lg">Redirecting to login...</p>
      </div>
    );
  }

  if (isAuthPage || pathname === '/') {
     // Render children directly without AppShell for login, signup, and landing page
     return <div className="min-h-screen bg-background text-foreground">{children}</div>;
  }
  
  // If user is authenticated and it's a protected page, render AppShell
  return <AppShell>{children}</AppShell>;
}
