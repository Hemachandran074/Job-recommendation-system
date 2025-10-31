import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleResetPassword = () => {
    // Validation
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Navigate to check email screen
    router.push({
      pathname: '/(auth)/check-email',
      params: { email: email.trim() }
    });
  };

  const handleBackToLogin = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            To reset your password, you need your email or{'\n'}
            mobile number that can be authenticated
          </Text>
        </View>

        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <View style={styles.imageContainer}>
            <Image
                source={require('../../assets/images/categories/Reset-Password.png')}
                style={styles.logo}
                resizeMode="contain"
            />
            </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.inputLabel}>Email</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Brandonelouis@gmail.com"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity 
            style={styles.resetButton} 
            onPress={handleResetPassword}
          >
            <Text style={styles.resetButtonText}>RESET PASSWORD</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBackToLogin}
          >
            <Text style={styles.backButtonText}>BACK TO LOGIN</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  },
  header: {
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  illustrationPlaceholder: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockDots: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B9EFF',
  },
  form: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#F8F8F8',
  },
  input: {
    height: 56,
    fontSize: 16,
    color: '#000',
  },
  resetButton: {
    backgroundColor: '#3B9EFF',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  resetButtonText: {
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
  logo: {
    width: 200,
    height: 200,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
