import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { User, UserProfile } from '../types';

// This would be stored securely in a real app, but is fine for localStorage mock
interface UserAccount extends User {
  password_hash: string; // In a real app, this would be a hash, not plaintext
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (username: string, pass: string) => Promise<void>;
  signUp: (name: string, username: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  userProfile: UserProfile | null;
  updateUserProfile: (profile: UserProfile) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getUsersFromStorage = (): UserAccount[] => {
    try {
        const storedUsers = localStorage.getItem('bytebuddy_users');
        return storedUsers ? JSON.parse(storedUsers) : [];
    } catch (error) {
        console.error("Failed to parse users from storage", error);
        return [];
    }
}

const getProfileFromStorage = (userId: string): UserProfile | null => {
    try {
        const storedProfile = localStorage.getItem(`bytebuddy_profile_${userId}`);
        return storedProfile ? JSON.parse(storedProfile) : null;
    } catch (error) {
        console.error("Failed to parse profile from storage", error);
        return null;
    }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('bytebuddy_user');
      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
        const profile = getProfileFromStorage(parsedUser.id);
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      localStorage.removeItem('bytebuddy_user');
    } finally {
      setLoading(false);
    }
  }, []);
  
  const handleLogin = (loggedInUser: User) => {
    localStorage.setItem('bytebuddy_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    const profile = getProfileFromStorage(loggedInUser.id);
    setUserProfile(profile);
  }

  const signUp = async (name: string, username: string, pass: string) => {
    const users = getUsersFromStorage();
    const existingUser = users.find(u => u.username === username);
    if(existingUser) {
        throw new Error("An account with this username already exists.");
    }

    const newUser: UserAccount = { 
        id: `user-${Date.now()}`, 
        username, 
        user_metadata: { name },
        password_hash: pass, // Storing plaintext password for mock purposes
    };

    users.push(newUser);
    localStorage.setItem('bytebuddy_users', JSON.stringify(users));

    handleLogin({id: newUser.id, username: newUser.username, user_metadata: newUser.user_metadata});
  };
  
  const signIn = async (username: string, pass: string) => {
    const users = getUsersFromStorage();
    const foundUser = users.find(u => u.username === username);

    if (!foundUser) {
        throw new Error("No account found with this username.");
    }

    if (foundUser.password_hash !== pass) { // Plaintext comparison for mock
        throw new Error("Incorrect password.");
    }
    
    handleLogin({id: foundUser.id, username: foundUser.username, user_metadata: foundUser.user_metadata});
  };

  const signOut = async () => {
    localStorage.removeItem('bytebuddy_user');
    setUser(null);
    setUserProfile(null);
  };

  const updateUserProfile = async (profile: UserProfile) => {
    if (user) {
        setUserProfile(profile);
        try {
            localStorage.setItem(`bytebuddy_profile_${user.id}`, JSON.stringify(profile));
        } catch (error) {
            console.error("Failed to save profile to storage", error);
        }
    }
  };
  
  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    userProfile,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
