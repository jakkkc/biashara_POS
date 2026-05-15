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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch profile
        const profileRef = doc(db, 'users', user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          const profileData = profileSnap.data() as UserProfile;
          setProfile({ ...profileData, id: profileSnap.id });
          
          if (profileData.businessId) {
            // Subscribe to business data
            const bizRef = doc(db, 'businesses', profileData.businessId);
            const unsubscribeBiz = onSnapshot(bizRef, (doc) => {
              if (doc.exists()) {
                setBusiness({ ...doc.data(), id: doc.id } as Business);
              }
            });
            return () => unsubscribeBiz();
          }
        }
      } else {
        setProfile(null);
        setBusiness(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
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
