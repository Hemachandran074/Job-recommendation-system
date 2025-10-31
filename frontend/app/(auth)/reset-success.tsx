import { View, Image, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

export default function PasswordResetSuccess() {
  const router = useRouter();

  const handleContinue = () => {
    // Navigate to sign in
    router.replace('/(auth)/signin');
  };

  const handleBackToLogin = () => {
    // Navigate to sign in
    router.replace('/(auth)/signin');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Successfully</Text>
          <Text style={styles.subtitle}>
            Your password has been updated, please change your{'\n'}
            password regularly to avoid this happening
          </Text>
        </View>

        {/* Success Illustration */}
        <View style={styles.illustrationContainer}>
          <View style={styles.imageContainer}>
            <Image
                source={require('../../assets/images/categories/sign-in.png')}
                style={styles.logo}
                resizeMode="contain"
            />
            </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.continueButton} 
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>CONTINUE</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBackToLogin}
          >
            <Text style={styles.backButtonText}>BACK TO LOGIN</Text>
          </TouchableOpacity>
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
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  illustrationPlaceholder: {
    width: 280,
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  shieldContainer: {
    position: 'absolute',
    right: 20,
    top: 40,
    zIndex: 2,
  },
  personContainer: {
    position: 'absolute',
    left: 60,
    top: 80,
    zIndex: 1,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#3B9EFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  continueButton: {
    backgroundColor: '#3B9EFF',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  backButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
    logo: {
    width: 250,
    height: 200,
  },
});
