import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useProfile } from '../../contexts/ProfileContext';
import { profileAPI } from '../../utils/api';
import React from 'react';

export default function PersonalDetails() {
  const router = useRouter();
  const { setProfile } = useProfile();
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);

  // Pre-populate all fields from AsyncStorage (including previously entered data)
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userName = await AsyncStorage.getItem('userName');
        const userEmail = await AsyncStorage.getItem('userEmail');
        const savedPersonalData = await AsyncStorage.getItem('personalData');
        
        if (savedPersonalData) {
          // Load previously saved personal data
          const data = JSON.parse(savedPersonalData);
          setName(data.name || userName || '');
          setDob(data.dob || '');
          setGender(data.gender || 'Male');
          setEmail(data.email || userEmail || '');
          setMobile(data.mobile || '');
          console.log('✅ Loaded personal data:', data);
        } else {
          // First time - use signup data
          if (userName) setName(userName);
          if (userEmail) setEmail(userEmail);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    
    loadUserData();
  }, []);

  const handleSubmit = async () => {
    if (!name || !email || !mobile) {
      Alert.alert('Error', 'Please fill all required fields (Name, Email, Mobile)');
      return;
    }

    try {
      setLoading(true);
      
      // Save personal data to AsyncStorage for persistence
      await AsyncStorage.setItem('personalData', JSON.stringify({
        name, dob, gender, email, mobile
      }));
      console.log('💾 Saved personal data to AsyncStorage');
      
      // Get stored education and skills data
      const educationData = JSON.parse(await AsyncStorage.getItem('education') || '{}');
      const skillsDataRaw = JSON.parse(await AsyncStorage.getItem('skills') || '{}');
      const userId = await AsyncStorage.getItem('userId');

      if (!userId) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      console.log('📤 Submitting complete profile to backend...');
      console.log('Education:', educationData);
      console.log('Skills:', skillsDataRaw);
      console.log('Personal:', { name, email, mobile, dob, gender });

      // Extract the actual skills array from the skills data object
      const skillsArray = skillsDataRaw.skills || [];
      const interestsArray = skillsDataRaw.interests || [];
      const technicalDomains = skillsDataRaw.technical_domains || [];
      
      // Combine all skills, interests, and domains into one array
      const allSkills = [...new Set([...skillsArray, ...interestsArray, ...technicalDomains])];

      // Prepare complete profile data for backend - match Supabase schema
      const profileData = {
        full_name: name.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
        location: skillsDataRaw.preferred_city || educationData.location || '',
        about: `${educationData.degree || ''} student from ${educationData.institute || 'university'}, interested in ${allSkills.slice(0, 3).join(', ') || 'various fields'}. ${skillsDataRaw.experience || 0} years of experience.`,
        skills: allSkills,
        interests: interestsArray,
        technical_domains: technicalDomains,
        // Education fields
        degree: educationData.degree || '',
        stream: educationData.stream || '',
        graduation_year: educationData.graduation_year || '',
        experience: skillsDataRaw.experience || '',
        preferred_city: skillsDataRaw.preferred_city || '',
        // resume_url will be added when user uploads resume
      };

      console.log('📦 Prepared profile data:', profileData);

      // Call backend API to update user profile
      const { userAPI } = await import('../../utils/api');
      const response = await userAPI.updateProfile(userId, profileData);
      
      console.log('✅ Profile updated successfully:', response);

      // Mark profile as complete
      await AsyncStorage.setItem('profileComplete', 'true');
      
      // Clear temporary storage
      await AsyncStorage.removeItem('education');
      await AsyncStorage.removeItem('skills');
      await AsyncStorage.removeItem('personalData');
      console.log('🧹 Cleared temporary profile data from AsyncStorage');

      // Update profile context with complete data
      await setProfile({
        personal: { 
          fullName: name, 
          email, 
          phone: mobile, 
          dob, 
          gender 
        },
        education: educationData,
        skills: {
          skills: skillsArray,
          interests: interestsArray,
          technical_domains: technicalDomains,
          experience: skillsDataRaw.experience,
          preferred_city: skillsDataRaw.preferred_city,
        },
      });

      console.log('✅ Profile saved successfully! Redirecting to dashboard...');

      // Stop loading
      setLoading(false);

      // Automatically redirect to dashboard without alert
      console.log('🚀 Navigating to dashboard...');
      router.replace('/dashboard');

    } catch (error: any) {
      console.log('📦 Profile submit error details:', error.response?.data || error.message || error);
      console.error('❌ Profile submit error:', error);
      console.error('Error details:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || error.response?.data?.detail || error.message || 'Failed to save profile';
      Alert.alert('Error', errorMessage);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(profile)/skills')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>Personal Details</Text>
          <Text style={styles.step}>Step 3 of 3</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Date of Birth</Text>
          <TextInput
            style={styles.input}
            placeholder="1-01-2000"
            value={dob}
            onChangeText={setDob}
          />

          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity 
              style={[styles.genderButton, gender === 'Male' && styles.genderButtonActive]}
              onPress={() => setGender('Male')}
            >
              <Text style={[styles.genderText, gender === 'Male' && styles.genderTextActive]}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.genderButton, gender === 'Female' && styles.genderButtonActive]}
              onPress={() => setGender('Female')}
            >
              <Text style={[styles.genderText, gender === 'Female' && styles.genderTextActive]}>Female</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="example@gmail.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Mobile No</Text>
          <TextInput
            style={styles.input}
            placeholder="0123456789"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
          />

          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>Submit</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  scrollContent: { flexGrow: 1, padding: 24 },
  header: { marginTop: 40, marginBottom: 32 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  step: { fontSize: 14, color: '#999' },
  form: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#000', marginBottom: 8, marginTop: 16 },
  input: { height: 56, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 28, paddingHorizontal: 20, fontSize: 16, backgroundColor: '#FFF' },
  genderContainer: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  genderButton: { flex: 1, height: 56, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  genderButtonActive: { backgroundColor: '#3B9EFF', borderColor: '#3B9EFF' },
  genderText: { fontSize: 16, color: '#666' },
  genderTextActive: { color: '#FFF', fontWeight: '600' },
  submitButton: { backgroundColor: '#3B9EFF', borderRadius: 50, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: 32 },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#FFF', fontSize: 18, fontWeight: '600' },
});
