import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../../utils/api';
import { useProfile } from '../../contexts/ProfileContext';

export default function SignIn() {
  const router = useRouter();
  const { signIn } = useProfile();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      console.log('📤 Attempting signin...');

      const response = await authAPI.signin({
        email: email.trim().toLowerCase(),
        password: password,
      });

      console.log('✅ Signin successful!', {
        hasToken: !!response.access_token,
        hasUser: !!response.user,
        userId: response.user?.id
      });

      // Check if we got valid response
      if (!response.access_token || !response.user) {
        console.error('❌ Invalid response:', response);
        Alert.alert('Error', 'Invalid response from server');
        return;
      }

      console.log('💾 Saving auth data...');

      // Save into ProfileContext and AsyncStorage
      await signIn({
        id: response.user.id,
        name: response.user.name || '',
        email: response.user.email,
        mobile: ''
      }, response.access_token);

      // Also save convenience keys used elsewhere
      await AsyncStorage.multiSet([
        ['userId', response.user.id],
        ['userEmail', response.user.email],
        ['userName', response.user.name || ''],
      ]);

      console.log('✅ Auth data saved');

      // Check if profile is complete
      const profileComplete = await AsyncStorage.getItem('profileComplete');
      
      console.log('🔍 Profile complete?', profileComplete);

      if (profileComplete === 'true') {
        console.log('📍 Navigating to dashboard...');
        router.replace('/dashboard');
      } else {
        console.log('📍 Navigating to education (incomplete profile)...');
        router.replace('/(profile)/education');
      }

    } catch (error: any) {
      console.error('❌ Signin error:', error);
      console.error('Error details:', error.response?.data);

      let errorMessage = 'Login failed. Please try again.';

      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Sign In Error', errorMessage);
    } finally {
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
            resizeMode="contain"
          />
        </View>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.subtitle}>Please sign in to your registered account</Text>
        </View>

        <View style={styles.form}>
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

          <TouchableOpacity 
            style={[styles.signInButton, loading && styles.signInButtonDisabled]} 
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.signInButtonText}>Sign in</Text>
            )}
          </TouchableOpacity>

          <View style={styles.forgotPasswordContainer}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
              <Text style={styles.resetLink}>Reset here</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.orText}>Or sign in with</Text>

          <View style={styles.socialButtons}>
            <TouchableOpacity style={styles.socialButton}>
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-facebook" size={20} color="#1877F2" />
            </TouchableOpacity>
          </View>

          <View style={styles.signUpPrompt}>
            <Text style={styles.signUpText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.signUpLink}>Sign up</Text>
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
  signInButton: {
    backgroundColor: '#3B9EFF',
    borderRadius: 50,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  signInButtonDisabled: {
    backgroundColor: '#9ECAFF',
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  forgotPasswordContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#666',
    fontSize: 14,
  },
  resetLink: {
    color: '#3B9EFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
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
  signUpPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signUpText: {
    color: '#666',
    fontSize: 14,
  },
  signUpLink: {
    color: '#3B9EFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});
