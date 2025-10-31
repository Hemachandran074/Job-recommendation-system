import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

export default function SkillsDetails() {
  const router = useRouter();
  const [skills, setSkills] = useState('');
  const [interests, setInterests] = useState('');
  const [technicalDomains, setTechnicalDomains] = useState('');
  const [experience, setExperience] = useState('0-3 yrs');
  const [preferredCity, setPreferredCity] = useState('');

  // Load saved data when component mounts
  useEffect(() => {
    const loadSkillsData = async () => {
      try {
        const savedData = await AsyncStorage.getItem('skills');
        if (savedData) {
          const data = JSON.parse(savedData);
          setSkills(Array.isArray(data.skills) ? data.skills.join(', ') : '');
          setInterests(Array.isArray(data.interests) ? data.interests.join(', ') : '');
          setTechnicalDomains(Array.isArray(data.technical_domains) ? data.technical_domains.join(', ') : '');
          setExperience(data.experience || '0-3 yrs');
          setPreferredCity(data.preferred_city || '');
          console.log('✅ Loaded skills data:', data);
        }
      } catch (error) {
        console.error('Error loading skills data:', error);
      }
    };
    
    loadSkillsData();
  }, []);

  const handleNext = async () => {
    if (!skills || !interests || !technicalDomains || !experience || !preferredCity) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    await AsyncStorage.setItem('skills', JSON.stringify({
      skills: skills.split(',').map(s => s.trim()),
      interests: interests.split(',').map(s => s.trim()),
      technical_domains: technicalDomains.split(',').map(s => s.trim()),
      experience,
      preferred_city: preferredCity
    }));

    router.push('/(profile)/personal');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(profile)/education')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>Skills and Competencies</Text>
          <Text style={styles.step}>Step 2 of 3</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Skills</Text>
          <TextInput
            style={styles.input}
            placeholder="Python, ML, DL, ..."
            value={skills}
            onChangeText={setSkills}
          />
          <Text style={styles.hint}>Separate with commas</Text>

          <Text style={styles.label}>Areas of Interests</Text>
          <TextInput
            style={styles.input}
            placeholder="SDE, Cloud Engineer, ..."
            value={interests}
            onChangeText={setInterests}
          />
          <Text style={styles.hint}>Separate with commas</Text>

          <Text style={styles.label}>Interests (Technical Domains)</Text>
          <TextInput
            style={styles.input}
            placeholder="MLOps, Generative AI, ..."
            value={technicalDomains}
            onChangeText={setTechnicalDomains}
          />
          <Text style={styles.hint}>Separate with commas</Text>

          <Text style={styles.label}>Experience</Text>
          <TextInput
            style={styles.input}
            placeholder="0-3 yrs"
            value={experience}
            onChangeText={setExperience}
          />

          <Text style={styles.label}>Preferred City</Text>
          <TextInput
            style={styles.input}
            placeholder="Coimbatore"
            value={preferredCity}
            onChangeText={setPreferredCity}
          />

          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
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
  hint: { fontSize: 12, color: '#999', marginTop: 4 },
  nextButton: { backgroundColor: '#3B9EFF', borderRadius: 50, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: 32 },
  nextButtonText: { color: '#FFF', fontSize: 18, fontWeight: '600' },
});
