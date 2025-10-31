import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useProfile } from '../contexts/ProfileContext';
import { useEffect, useState } from 'react';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthAndRedirect();
  }, []);

  const checkAuthAndRedirect = async () => {
    try {
      // Check if user is authenticated
      const token = await AsyncStorage.getItem('authToken');
      const userId = await AsyncStorage.getItem('userId');
      
      if (token && userId) {
        // User is logged in - check if profile is complete
        const profileComplete = await AsyncStorage.getItem('profileComplete');
        
        if (profileComplete === 'true') {
          // Profile complete -> Dashboard
          router.replace('/dashboard');
        } else {
          // Profile incomplete -> Sign in page (first step)
          router.replace('/(auth)/signin');
        }
      } else {
        // Not logged in -> Sign in page
        router.replace('/(auth)/signin');
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      // Default to sign in on error
      router.replace('/(auth)/signin');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Job Finder</Text>
      <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
      <Text style={styles.subtitle}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  loader: {
    marginVertical: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
});
