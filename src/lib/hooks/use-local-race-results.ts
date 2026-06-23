'use client';
import { useState, useEffect, useCallback } from 'react';
import type { RaceResult } from '@/lib/types';

const STORAGE_KEY = 'aquaSpeed-localRaceResults';

const initialData: RaceResult[] = [];

export function useLocalRaceResults(dateRange?: { startDate: Date, endDate: Date }) {
  const [raceResults, setRaceResults] = useState<RaceResult[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setIsInitialized(false);
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      let results: RaceResult[] = storedData ? JSON.parse(storedData) : initialData;
      
      if (dateRange) {
        results = results.filter(r => {
          const raceDate = new Date(r.date);
          return raceDate >= dateRange.startDate && raceDate <= dateRange.endDate;
        });
      }
      
      setRaceResults(results);
    } catch (error) {
      console.error('Failed to load local race results from localStorage', error);
      setRaceResults(initialData);
    } finally {
      setIsInitialized(true);
    }
  }, [dateRange]);

  const addLocalRaceResult = useCallback((result: RaceResult) => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      const currentResults = storedData ? JSON.parse(storedData) : [];
      const updatedResults = [result, ...currentResults];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedResults));
      
      // Re-filter based on the current dateRange
      let resultsToSet = updatedResults;
      if (dateRange) {
        resultsToSet = updatedResults.filter(r => {
          const raceDate = new Date(r.date);
          return raceDate >= dateRange.startDate && raceDate <= dateRange.endDate;
        });
      }
      setRaceResults(resultsToSet);

    } catch (error) {
        console.error('Failed to save local race results to localStorage', error);
    }
  }, [dateRange]);

  const removeLocalRaceResult = useCallback((id: string) => {
     try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      let currentResults: RaceResult[] = storedData ? JSON.parse(storedData) : [];
      const updatedResults = currentResults.filter((result) => result.id !== id);
       localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedResults));
      
      // Re-filter based on the current dateRange
      let resultsToSet = updatedResults;
       if (dateRange) {
        resultsToSet = updatedResults.filter(r => {
          const raceDate = new Date(r.date);
          return raceDate >= dateRange.startDate && raceDate <= dateRange.endDate;
        });
      }
      setRaceResults(resultsToSet);
     } catch (error) {
        console.error('Failed to save local race results to localStorage', error);
     }
  }, [dateRange]);

  return { raceResults, addRaceResult: addLocalRaceResult, removeRaceResult: removeLocalRaceResult, isInitialized };
}
