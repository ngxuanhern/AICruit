
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; // Added useRouter
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Home, Users, FileText, Settings, Menu, ListChecks, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext"; // Added
import { useToast } from "@/hooks/use-toast"; // Added

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/candidates", label: "Candidates", icon: Users },
  { href: "/process", label: "Process Application", icon: FileText },
  { href: "/job-descriptions", label: "Job Descriptions", icon: ListChecks },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold text-lg text-primary">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7 w-7">
        <rect width="28" height="28" rx="6" fill="currentColor"/>
        {/* Stylized 'A' - a triangle with a crossbar */}
        <path d="M9 20L14 8L19 20" stroke="hsl(var(--primary-foreground))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M11 15H17" stroke="hsl(var(--primary-foreground))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="font-headline">AICruit</span>
    </Link>
  );
}

function UserProfile() {
  const { user, logOut } = useAuth(); // Use AuthContext
  const { toast } = useToast();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logOut();
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      // router.push('/login') is handled by logOut function in AuthContext
    } catch (error) {
      toast({ title: "Logout Failed", description: "Could not log out. Please try again.", variant: "destructive" });
    }
  };

  if (!user) {
    return (
      <Link href="/login" passHref legacyBehavior>
        <Button variant="outline">Login</Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="user avatar" />
            <AvatarFallback>{user.email?.substring(0, 2).toUpperCase() || 'AC'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">AICruit User</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


function MainSidebar() {
  const pathname = usePathname();
  const { open, setOpen, isMobile } = useSidebar();

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="border-r"
    >
      <SidebarHeader className="p-4 flex items-center justify-between">
        <Logo />
        {!isMobile && open && (
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(false)}>
            <Menu className="h-5 w-5" />
          </Button>
        )}
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                  className="w-full justify-start"
                  tooltip={item.label}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
      </SidebarFooter>
    </Sidebar>
  );
}


export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <MainSidebar />
        <SidebarInset className="flex flex-col flex-1">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-6">
            <div className="md:hidden">
              <SidebarTrigger />
            </div>
            <div className="flex-1">
            </div>
            <UserProfile />
          </header>
          <main className="flex-1 p-6 overflow-auto bg-secondary/20"> {/* Added subtle bg to main content area */}
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
