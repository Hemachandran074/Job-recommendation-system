import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import Ionicons from '@expo/vector-icons/build/Ionicons';

export default function EducationDetails() {
  const router = useRouter();
  const [degree, setDegree] = useState('');
  const [stream, setStream] = useState('');
  const [institute, setInstitute] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [location, setLocation] = useState('');

  // Load saved data when component mounts
  useEffect(() => {
    const loadEducationData = async () => {
      try {
        const savedData = await AsyncStorage.getItem('education');
        if (savedData) {
          const data = JSON.parse(savedData);
          setDegree(data.degree || '');
          setStream(data.stream || '');
          setInstitute(data.institute || '');
          setGraduationYear(data.graduation_year || '');
          setCgpa(data.cgpa || '');
          setLocation(data.location || '');
          console.log('✅ Loaded education data:', data);
        }
      } catch (error) {
        console.error('Error loading education data:', error);
      }
    };
    
    loadEducationData();
  }, []);

  const handleNext = async () => {
    if (!degree || !stream || !institute || !graduationYear || !cgpa || !location) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    await AsyncStorage.setItem('education', JSON.stringify({
      degree, stream, institute, graduation_year: graduationYear, cgpa, location
    }));

    router.push('/(profile)/skills');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>Education Details</Text>
          <Text style={styles.step}>Step 1 of 3</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Degree</Text>
          <TextInput
            style={styles.input}
            placeholder="B.E, B.TECH"
            value={degree}
            onChangeText={setDegree}
          />

          <Text style={styles.label}>Stream/Major</Text>
          <TextInput
            style={styles.input}
            placeholder="Computer Science"
            value={stream}
            onChangeText={setStream}
          />

          <Text style={styles.label}>Institute Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Sri Shakthi Institute"
            value={institute}
            onChangeText={setInstitute}
          />

          <Text style={styles.label}>Year Of Graduation</Text>
          <TextInput
            style={styles.input}
            placeholder="2027"
            value={graduationYear}
            onChangeText={setGraduationYear}
            keyboardType="number-pad"
          />

          <Text style={styles.label}>CGPA</Text>
          <TextInput
            style={styles.input}
            placeholder="8.2"
            value={cgpa}
            onChangeText={setCgpa}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Coimbatore, Tamil Nadu"
            value={location}
            onChangeText={setLocation}
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
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  scrollContent: { flexGrow: 1, padding: 24 },
  header: { marginTop: 40, marginBottom: 32 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  step: { fontSize: 14, color: '#999' },
  form: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#000', marginBottom: 8, marginTop: 16 },
  input: { height: 56, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 28, paddingHorizontal: 20, fontSize: 16, backgroundColor: '#FFF' },
  nextButton: { backgroundColor: '#3B9EFF', borderRadius: 50, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: 32 },
  nextButtonText: { color: '#FFF', fontSize: 18, fontWeight: '600' },
});
