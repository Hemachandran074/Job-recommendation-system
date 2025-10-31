import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../../utils/api';
import { useProfile } from '../../contexts/ProfileContext';

export default function SignUp() {
  const router = useRouter();
  const { signIn } = useProfile();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    // Validation
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.signup({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      
      console.log('📦 Signup response:', response);
      
      // If backend returned that email confirmation is required, send user to check-email
      if (response.email_confirmation_required) {
        console.log('⚠️ Email confirmation required for:', response.user?.email);
        // Save userId and email, then navigate to check-email screen
        if (response.user?.id) {
          await AsyncStorage.setItem('userId', response.user.id);
        }
        await AsyncStorage.setItem('userEmail', email.trim().toLowerCase());
        setLoading(false);
        router.push({ pathname: '/(auth)/check-email', params: { email: email.trim().toLowerCase() } });
        return;
      }

      if (response.access_token && response.user) {
        console.log('✅ Signup successful! Saving user data...');
        
        // Save to context (which also saves to AsyncStorage)
        await signIn({
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          mobile: mobile.trim() || '',
        }, response.access_token);
        
        // Save additional data needed for onboarding
        await AsyncStorage.setItem('userId', response.user.id);
        await AsyncStorage.setItem('userEmail', response.user.email);
        await AsyncStorage.setItem('userName', response.user.name);
        await AsyncStorage.setItem('profileComplete', 'false');
        
        console.log('📍 All data saved! Navigating to education page...');
        
        // Stop loading before navigation
        setLoading(false);
        
        // Navigate immediately
        console.log('🚀 Navigating to education...');
        router.push('/(profile)/education');
        
      } else {
        Alert.alert('Error', 'Registration failed');
        setLoading(false);
      }
    } catch (error: any) {
      console.log('📦 Signup error details:', error.response?.data || error.message || error);
      console.error('Sign up error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to create account. Please try again.';
      Alert.alert('Sign Up Failed', errorMessage);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Image Placeholder */}
        <View style={styles.imageContainer}>
          <Image
            source={require('../../assets/images/categories/sign-in.png')}
            style={styles.logo}
            resizeMode="stretch"
          />
        </View>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(auth)/signin')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>Sign up</Text>
          <Text style={styles.subtitle}>Please sign up to create a new account</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mobile Number"
              placeholderTextColor="#999"
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#999" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
              <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#999" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.signUpButton, loading && styles.signUpButtonDisabled]} 
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.signUpButtonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.orText}>Or sign up with</Text>

          <View style={styles.socialButtons}>
            <TouchableOpacity style={styles.socialButton}>
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-facebook" size={20} color="#1877F2" />
            </TouchableOpacity>
          </View>

          <View style={styles.signInPrompt}>
            <Text style={styles.signInText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signin')}>
              <Text style={styles.signInLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
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
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: -50,
  },
  logo: {
    width: 160,
    height: 160,
  },
  header: {
    marginTop: 0,
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 50,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#000',
  },
  eyeIcon: {
    padding: 8,
  },
  signUpButton: {
    backgroundColor: '#3B9EFF',
    borderRadius: 50,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  signUpButtonDisabled: {
    backgroundColor: '#9ECAFF',
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  orText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    marginBottom: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  socialButton: {
    width: 140,
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonText: {
    fontSize: 14,
    color: '#666',
  },
  signInPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signInText: {
    color: '#666',
    fontSize: 14,
  },
  signInLink: {
    color: '#3B9EFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});
