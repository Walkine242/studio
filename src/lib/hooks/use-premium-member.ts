'use client';
import { useState, useEffect } from 'react';

export function usePremiumMember() {
  return {
    isPremium: true,
    isInitialized: true,
    setPremiumStatus: () => {},
    togglePremium: () => {},
  };
}

