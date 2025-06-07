
"use client";

import type { Candidate } from '@/lib/types';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CandidateContextType {
  candidates: Candidate[];
  addCandidate: (candidate: Candidate) => void;
  updateCandidate: (candidate: Candidate) => void;
  deleteCandidate: (candidateId: string) => void;
  getCandidateById: (candidateId: string) => Candidate | undefined;
  loading: boolean;
}

const CandidateContext = createContext<CandidateContextType | undefined>(undefined);

const CANDIDATES_STORAGE_KEY = 'aicruit_candidates';

export const CandidateProvider = ({ children }: { children: ReactNode }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedCandidates = localStorage.getItem(CANDIDATES_STORAGE_KEY);
      if (storedCandidates) {
        setCandidates(JSON.parse(storedCandidates));
      }
    } catch (error) {
      console.error("Failed to load candidates from localStorage:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem(CANDIDATES_STORAGE_KEY, JSON.stringify(candidates));
      } catch (error) {
        console.error("Failed to save candidates to localStorage:", error);
      }
    }
  }, [candidates, loading]);

  const addCandidate = (candidate: Candidate) => {
    setCandidates((prevCandidates) => [candidate, ...prevCandidates]);
  };

  const updateCandidate = (updatedCandidate: Candidate) => {
    setCandidates((prevCandidates) =>
      prevCandidates.map((c) => (c.id === updatedCandidate.id ? updatedCandidate : c))
    );
  };

  const deleteCandidate = (candidateId: string) => {
    setCandidates((prevCandidates) => prevCandidates.filter((c) => c.id !== candidateId));
  };

  const getCandidateById = (candidateId: string) => {
    return candidates.find((c) => c.id === candidateId);
  };
  

  return (
    <CandidateContext.Provider value={{ candidates, addCandidate, updateCandidate, deleteCandidate, getCandidateById, loading }}>
      {children}
    </CandidateContext.Provider>
  );
};

export const useCandidates = () => {
  const context = useContext(CandidateContext);
  if (context === undefined) {
    throw new Error('useCandidates must be used within a CandidateProvider');
  }
  return context;
};
