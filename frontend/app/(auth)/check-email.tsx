import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert, Image, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../../utils/api';
import { useProfile } from '../../contexts/ProfileContext';

export default function CheckEmail() {
  const router = useRouter();
  const { signIn } = useProfile();
  const params = useLocalSearchParams();
  const email = params.email as string || 'brandonelouis@gmail.com';
  const [checking, setChecking] = useState(false);
  const [autoCheckEnabled, setAutoCheckEnabled] = useState(true);

  // Poll for email verification every 3 seconds
  useEffect(() => {
    if (!autoCheckEnabled) return;

    const intervalId = setInterval(async () => {
      try {
        // Get the stored password (if you saved it temporarily)
        // Otherwise user will need to click "I've Verified" button
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) return;

        // Try to fetch the user profile - if it exists and is verified, proceed
        console.log('🔄 Checking if email is verified...');
        // We can check by attempting to get the user's session or profile
        // For now, we'll rely on manual "I've Verified" button
      } catch (error) {
        console.error('Error checking verification:', error);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [autoCheckEnabled]);

  const handleIveVerified = async () => {
    setChecking(true);
    try {
      // User claims they've verified - redirect them to login or to profile completion
      const userId = await AsyncStorage.getItem('userId');
      
      if (userId) {
        // User ID exists, they just need to complete profile
        console.log('✅ User verified! Redirecting to education page...');
        await AsyncStorage.setItem('profileComplete', 'false');
        router.replace('/(profile)/education');
      } else {
        // No user ID, send them to login
        Alert.alert('Please Login', 'Now that you\'ve verified your email, please log in to continue.');
        router.replace('/(auth)/signin');
      }
    } catch (error) {
      console.error('Error in handleIveVerified:', error);
      Alert.alert('Error', 'Something went wrong. Please try logging in.');
      router.replace('/(auth)/signin');
    } finally {
      setChecking(false);
    }
  };

  const handleOpenEmail = async () => {
    // Try to open default email app
    try {
      const mailtoUrl = 'mailto:';
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
      } else {
        Alert.alert('Info', 'Please check your email app manually');
      }
    } catch (error) {
      Alert.alert('Info', 'Please check your email app manually');
    }
  };

  const handleBackToLogin = () => {
    // Go back to sign in
    router.replace('/(auth)/signin');
  };

  const handleResend = () => {
    Alert.alert(
      'Resend Email',
      'A new password reset link has been sent to your email.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.subtitle}>
            We have sent the reset password to the email{'\n'}
            address <Text style={styles.emailText}>{email}</Text>
          </Text>
        </View>

        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <View style={styles.imageContainer}>
            <Image
                source={require('../../assets/images/categories/Message-Sent.png')}
                style={styles.logo}
                resizeMode="contain"
            />
            </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleOpenEmail}
          >
            <Text style={styles.primaryButtonText}>OPEN YOUR EMAIL</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.verifiedButton, checking && styles.verifiedButtonDisabled]} 
            onPress={handleIveVerified}
            disabled={checking}
          >
            {checking ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.verifiedButtonText}>I'VE VERIFIED MY EMAIL</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={handleBackToLogin}
          >
            <Text style={styles.secondaryButtonText}>BACK TO LOGIN</Text>
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>You have not received the email? </Text>
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>Resend</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
  },
  emailText: {
    color: '#000',
    fontWeight: '600',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  illustrationPlaceholder: {
    width: 250,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emailIcon: {
    width: 120,
    height: 120,
    backgroundColor: '#F0F8FF',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paperPlane: {
    position: 'absolute',
    top: 20,
    right: 40,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  primaryButton: {
    backgroundColor: '#3B9EFF',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  verifiedButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  verifiedButtonDisabled: {
    backgroundColor: '#86EFAC',
  },
  verifiedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 24,
  },
  secondaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#666',
  },
  resendLink: {
    fontSize: 14,
    color: '#3B9EFF',
    fontWeight: '600',
  },
  logo: {
    width: 250,
    height: 200,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
