
'use client';

import React from 'react';
import { PageTitle } from '@/components/shared/PageTitle';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, FileText, CheckCircle, AlertTriangle, Gauge, Sparkles, Skull, Bot, MessageSquareWarning } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useCandidates } from '@/context/CandidateContext';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'; // Import LoadingSpinner

const chartConfig = {
  candidates: {
    label: "Candidates",
    color: "hsl(var(--primary))",
  },
  ranked: {
    label: "Ranked",
    color: "hsl(var(--accent))",
  },
} satisfies import("@/components/ui/chart").ChartConfig


export default function DashboardPage() {
  const { candidates, loading: candidatesLoading } = useCandidates(); // Renamed loading to avoid conflicts

  const totalCandidates = candidates.length;
  const highPotentialCount = candidates.filter(c => c.rankingData && c.rankingData.ranking >= 80).length;
  
  const flaggedForAuthenticityCount = candidates.filter(c => {
    if (!c.authenticityData) return false;
    const { isPotentiallyAiGenerated, isPotentiallyFraudulent } = c.authenticityData;
    return isPotentiallyAiGenerated || isPotentiallyFraudulent;
  }).length;

  const getFlaggedIcon = () => {
    const aiCount = candidates.filter(c => c.authenticityData?.isPotentiallyAiGenerated && !c.authenticityData?.isPotentiallyFraudulent).length;
    const fraudCount = candidates.filter(c => c.authenticityData?.isPotentiallyFraudulent && !c.authenticityData?.isPotentiallyAiGenerated).length;
    const bothCount = candidates.filter(c => c.authenticityData?.isPotentiallyAiGenerated && c.authenticityData?.isPotentiallyFraudulent).length;

    if (bothCount > 0) return Skull;
    if (aiCount > 0 && fraudCount > 0) return AlertTriangle; // Mix of issues
    if (aiCount > 0) return Bot;
    if (fraudCount > 0) return MessageSquareWarning;
    return AlertTriangle; // Default if flagged but not fitting above
  };
  const FlaggedIcon = flaggedForAuthenticityCount > 0 ? getFlaggedIcon() : AlertTriangle;


  const rankingDistributionData = React.useMemo(() => {
    const bins = [
      { name: "0-20", count: 0 },
      { name: "21-40", count: 0 },
      { name: "41-60", count: 0 },
      { name: "61-80", count: 0 },
      { name: "81-100", count: 0 },
    ];
    candidates.forEach(c => {
      if (c.rankingData) {
        const rank = c.rankingData.ranking;
        if (rank <= 20) bins[0].count++;
        else if (rank <= 40) bins[1].count++;
        else if (rank <= 60) bins[2].count++;
        else if (rank <= 80) bins[3].count++;
        else bins[4].count++;
      }
    });
    return bins;
  }, [candidates]);

  if (candidatesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size={48} />
        <p className="ml-4">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle title="Dashboard" description="Overview of your talent acquisition pipeline." icon={Gauge} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCandidates}</div>
            <p className="text-xs text-muted-foreground">
              Processed applications in the system.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Potential</CardTitle>
            <CheckCircle className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highPotentialCount}</div>
            <p className="text-xs text-muted-foreground">
              Candidates ranked 80+
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged Applications</CardTitle>
            <FlaggedIcon className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flaggedForAuthenticityCount}</div>
            <p className="text-xs text-muted-foreground">
             Marked as AI-generated or potentially fake.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Candidate Ranking Distribution</CardTitle>
            <CardDescription>Distribution of candidates by ranking scores.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={rankingDistributionData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="count" fill="var(--color-candidates)" radius={4} />
                  </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col space-y-4">
            <Link href="/process" passHref legacyBehavior>
              <Button className="w-full" size="lg">
                <FileText className="mr-2 h-5 w-5" /> Process New Application
              </Button>
            </Link>
            <Link href="/candidates" passHref legacyBehavior>
              <Button variant="outline" className="w-full" size="lg">
                <Users className="mr-2 h-5 w-5" /> View All Candidates
              </Button>
            </Link>
          </CardContent>
        </Card>

         <Card>
          <CardHeader>
            <CardTitle>Unlock Your Hiring Potential with AICruit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Welcome to your AI-powered command center for talent acquisition! 
              From here, you can seamlessly process new applications, review AI-screened candidates, 
              manage job descriptions, and gain valuable insights into your hiring pipeline. 
              Let's find your next great hire!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

