import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
}

interface ProfileContextType {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => void;
  hasProfile: boolean;
  // Authentication
  isAuthenticated: boolean;
  authUser: AuthUser | null;
  token: string | null;
  signIn: (user: AuthUser, token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  setProfile: () => {},
  hasProfile: false,
  isAuthenticated: false,
  authUser: null,
  token: null,
  signIn: async () => {},
  signOut: async () => {},
});

export const useProfile = () => useContext(ProfileContext);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
    loadAuth();
  }, []);

  const loadProfile = async () => {
    try {
      const saved = await AsyncStorage.getItem('userProfile');
      if (saved) {
        setProfileState(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadAuth = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('authUser');
      const savedToken = await AsyncStorage.getItem('authToken');
      if (savedUser && savedToken) {
        setAuthUser(JSON.parse(savedUser));
        setToken(savedToken);
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    }
  };

  const setProfile = async (newProfile: UserProfile | null) => {
    try {
      if (newProfile) {
        await AsyncStorage.setItem('userProfile', JSON.stringify(newProfile));
      } else {
        await AsyncStorage.removeItem('userProfile');
      }
      setProfileState(newProfile);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const signIn = async (user: AuthUser, userToken: string) => {
    try {
      await AsyncStorage.setItem('authUser', JSON.stringify(user));
      await AsyncStorage.setItem('authToken', userToken);
      setAuthUser(user);
      setToken(userToken);
    } catch (error) {
      console.error('Error saving auth:', error);
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('authUser');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userProfile');
      setAuthUser(null);
      setToken(null);
      setProfileState(null);
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  return (
    <ProfileContext.Provider 
      value={{ 
        profile, 
        setProfile, 
        hasProfile: !!profile,
        isAuthenticated: !!authUser && !!token,
        authUser,
        token,
        signIn,
        signOut,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};
