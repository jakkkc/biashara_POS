import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, Business } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  business: Business | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  business: null,
  loading: true,
  isAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    let unsubscribeBiz: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      try {
        setUser(user);
        
        // Cleanup previous subscriptions
        if (unsubscribeProfile) unsubscribeProfile();
        if (unsubscribeBiz) unsubscribeBiz();
        unsubscribeProfile = undefined;
        unsubscribeBiz = undefined;

        if (user) {
          // Subscribe to profile
          const profileRef = doc(db, 'users', user.uid);
          unsubscribeProfile = onSnapshot(profileRef, (snap) => {
            if (snap.exists()) {
              const profileData = snap.data() as UserProfile;
              setProfile({ ...profileData, id: snap.id });
              
              if (profileData.businessId) {
                // Subscribe to business
                const bizRef = doc(db, 'businesses', profileData.businessId);
                // Note: This replaces previous business sub if businessId changed
                if (unsubscribeBiz) unsubscribeBiz();
                unsubscribeBiz = onSnapshot(bizRef, (bizSnap) => {
                  if (bizSnap.exists()) {
                    setBusiness({ ...bizSnap.data(), id: bizSnap.id } as Business);
                  }
                });
              }
            } else {
              setProfile(null);
            }
          });
        } else {
          setProfile(null);
          setBusiness(null);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeBiz) unsubscribeBiz();
    };
  }, []);

  const value = {
    user,
    profile,
    business,
    loading,
    isAdmin: user?.email === 'jacmwaniki@gmail.com',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
