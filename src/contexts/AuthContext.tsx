import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, AuthContextType } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'carecrew_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for existing session
    const storedUser = localStorage.getItem(STORAGE_KEY);
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (phone: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Normalize phone number (remove spaces, dashes)
      const normalizedPhone = phone.replace(/[\s-]/g, '');

      // Check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('phone', normalizedPhone)
        .maybeSingle();

      if (fetchError) {
        return { success: false, error: 'Failed to check user. Please try again.' };
      }

      let currentUser: User;

      if (existingUser) {
        currentUser = existingUser as User;
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({ phone: normalizedPhone })
          .select()
          .single();

        if (createError || !newUser) {
          return { success: false, error: 'Failed to create account. Please try again.' };
        }
        currentUser = newUser as User;
      }

      // Store in localStorage and state
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
      setUser(currentUser);
      return { success: true };
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred.' };
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
