'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface CSRFContextType {
  csrfToken: string | null;
  refreshToken: () => Promise<void>;
  getHeaders: () => Record<string, string>;
  loading: boolean;
}

const CSRFContext = createContext<CSRFContextType | undefined>(undefined);

interface CSRFProviderProps {
  children: ReactNode;
}

export function CSRFProvider({ children }: CSRFProviderProps) {
  const { data: session, status } = useSession();
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchToken = async () => {
    if (!session?.user) {
      setCsrfToken(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/auth/csrf-token', {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setCsrfToken(data.csrfToken);
        
        // Store token in sessionStorage for persistence across page refreshes
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('csrf-token', data.csrfToken);
        }
      } else {
        console.error('Failed to fetch CSRF token:', response.statusText);
        setCsrfToken(null);
      }
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
      setCsrfToken(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    await fetchToken();
  };

  const getHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    return headers;
  };

  // Initial token fetch when session is available
  useEffect(() => {
    if (status === 'loading') return;

    if (session?.user) {
      // Check if we have a token in sessionStorage first
      if (typeof window !== 'undefined') {
        const storedToken = sessionStorage.getItem('csrf-token');
        if (storedToken) {
          setCsrfToken(storedToken);
          setLoading(false);
          // Still fetch a fresh token in the background
          fetchToken();
          return;
        }
      }
      fetchToken();
    } else {
      setCsrfToken(null);
      setLoading(false);
      // Clear stored token if no session
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('csrf-token');
      }
    }
  }, [session, status]);

  // Refresh token every 50 minutes (before 1-hour expiry)
  useEffect(() => {
    if (!session?.user || !csrfToken) return;

    const interval = setInterval(() => {
      fetchToken();
    }, 50 * 60 * 1000); // 50 minutes

    return () => clearInterval(interval);
  }, [session, csrfToken]);

  const contextValue: CSRFContextType = {
    csrfToken,
    refreshToken,
    getHeaders,
    loading
  };

  return (
    <CSRFContext.Provider value={contextValue}>
      {children}
    </CSRFContext.Provider>
  );
}

export function useCSRF(): CSRFContextType {
  const context = useContext(CSRFContext);
  if (context === undefined) {
    throw new Error('useCSRF must be used within a CSRFProvider');
  }
  return context;
}

// Custom hook for making CSRF-protected API calls
export function useSecureFetch() {
  const { getHeaders } = useCSRF();

  const secureFetch = async (url: string, options: RequestInit = {}) => {
    const headers = {
      ...getHeaders(),
      ...options.headers,
    };

    return fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });
  };

  return secureFetch;
}