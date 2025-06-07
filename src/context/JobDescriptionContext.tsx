
"use client";

import type { JobDescription } from '@/lib/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface JobDescriptionContextType {
  jobDescriptions: JobDescription[];
  addJobDescription: (jd: Omit<JobDescription, 'id' | 'createdAt'>) => void;
  updateJobDescription: (jd: JobDescription) => void;
  deleteJobDescription: (jobDescriptionId: string) => void;
  getJobDescriptionById: (jobDescriptionId: string) => JobDescription | undefined;
  loading: boolean;
}

const JobDescriptionContext = createContext<JobDescriptionContextType | undefined>(undefined);

const JOB_DESCRIPTIONS_STORAGE_KEY = 'aicruit_job_descriptions';

export const JobDescriptionProvider = ({ children }: { children: ReactNode }) => {
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedJobDescriptions = localStorage.getItem(JOB_DESCRIPTIONS_STORAGE_KEY);
      if (storedJobDescriptions) {
        setJobDescriptions(JSON.parse(storedJobDescriptions));
      }
    } catch (error) {
      console.error("Failed to load job descriptions from localStorage:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(JOB_DESCRIPTIONS_STORAGE_KEY, JSON.stringify(jobDescriptions));
      } catch (error) {
        console.error("Failed to save job descriptions to localStorage:", error);
      }
    }
  }, [jobDescriptions, loading]);

  const addJobDescription = (jdData: Omit<JobDescription, 'id' | 'createdAt'>) => {
    const newJobDescription: JobDescription = {
      ...jdData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setJobDescriptions((prevJds) => [newJobDescription, ...prevJds]);
  };

  const updateJobDescription = (updatedJd: JobDescription) => {
    setJobDescriptions((prevJds) =>
      prevJds.map((jd) => (jd.id === updatedJd.id ? updatedJd : jd))
    );
  };

  const deleteJobDescription = (jobDescriptionId: string) => {
    setJobDescriptions((prevJds) => prevJds.filter((jd) => jd.id !== jobDescriptionId));
  };

  const getJobDescriptionById = (jobDescriptionId: string) => {
    return jobDescriptions.find((jd) => jd.id === jobDescriptionId);
  };
  

  return (
    <JobDescriptionContext.Provider value={{ jobDescriptions, addJobDescription, updateJobDescription, deleteJobDescription, getJobDescriptionById, loading }}>
      {children}
    </JobDescriptionContext.Provider>
  );
};

export const useJobDescriptions = () => {
  const context = useContext(JobDescriptionContext);
  if (context === undefined) {
    throw new Error('useJobDescriptions must be used within a JobDescriptionProvider');
  }
  return context;
};

