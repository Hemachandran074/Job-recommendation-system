import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useProfile } from '../contexts/ProfileContext';
import { userAPI } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';

interface WorkExperience {
  id: string;
  position: string;
  company: string;
  duration: string;
  years: string;
}

interface Education {
  id: string;
  degree: string;
  institution: string;
  duration: string;
  years: string;
}

interface Resume {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
}

interface UserProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  experience_level?: string;
  experience_years?: number;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  preferred_job_titles?: string[];
  preferred_locations?: string[];
  preferred_job_type?: string;
}

export default function Profile() {
  const router = useRouter();
  const { authUser, signOut } = useProfile();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  
  // User profile data from backend
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [aboutText, setAboutText] = useState('');
  
  // Work Experience State
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);

  // Education State
  const [education, setEducation] = useState<Education[]>([]);

  // Skills State
  const [skills, setSkills] = useState<string[]>([]);

  // Languages State
  const [languages, setLanguages] = useState<string[]>([]);

  // Resume State
  const [resumes, setResumes] = useState<Resume[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'work' | 'education' | 'skill' | 'language'>('work');
  const [editingItem, setEditingItem] = useState<any>(null);

  // Modal form states
  const [formData, setFormData] = useState({
    position: '',
    company: '',
    duration: '',
    years: '',
    degree: '',
    institution: '',
    skill: '',
    language: ''
  });

  // Load profile data from backend
  const loadProfileData = useCallback(async () => {
    if (!authUser?.id) {
      setLoading(false);
      return;
    }

    try {
      console.log('� Loading profile for user:', authUser.id);
      const data = await userAPI.getProfile(authUser.id);
      console.log('📦 Profile data received:', data);
      
      setProfileData(data);
      setAboutText(data.bio || 'No bio added yet. Click edit to add your professional summary.');
      setSkills(data.skills || []);
      
      // Map backend data to UI format
      // Note: Backend doesn't have work_experience, education_details yet
      // These will be added when resume is uploaded
      
    } catch (error: any) {
      console.error('❌ Error loading profile:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  }, [loadProfileData]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const openEditModal = (type: 'work' | 'education' | 'skill' | 'language', item?: any) => {
    setModalType(type);
    setEditingItem(item);
    if (item) {
      setFormData({
        position: item.position || '',
        company: item.company || '',
        duration: item.duration || '',
        years: item.years || '',
        degree: item.degree || '',
        institution: item.institution || '',
        skill: item.skill || '',
        language: item.language || ''
      });
    } else {
      setFormData({
        position: '',
        company: '',
        duration: '',
        years: '',
        degree: '',
        institution: '',
        skill: '',
        language: ''
      });
    }
    setShowModal(true);
  };

  const handleSaveItem = () => {
    if (modalType === 'work') {
      if (editingItem) {
        setWorkExperience(prev => prev.map(item => 
          item.id === editingItem.id 
            ? { ...item, position: formData.position, company: formData.company, duration: formData.duration, years: formData.years }
            : item
        ));
      } else {
        const newItem: WorkExperience = {
          id: Date.now().toString(),
          position: formData.position,
          company: formData.company,
          duration: formData.duration,
          years: formData.years
        };
        setWorkExperience(prev => [...prev, newItem]);
      }
    } else if (modalType === 'education') {
      if (editingItem) {
        setEducation(prev => prev.map(item => 
          item.id === editingItem.id 
            ? { ...item, degree: formData.degree, institution: formData.institution, duration: formData.duration, years: formData.years }
            : item
        ));
      } else {
        const newItem: Education = {
          id: Date.now().toString(),
          degree: formData.degree,
          institution: formData.institution,
          duration: formData.duration,
          years: formData.years
        };
        setEducation(prev => [...prev, newItem]);
      }
    } else if (modalType === 'skill') {
      if (formData.skill.trim() && !skills.includes(formData.skill.trim())) {
        setSkills(prev => [...prev, formData.skill.trim()]);
      }
    } else if (modalType === 'language') {
      if (formData.language.trim() && !languages.includes(formData.language.trim())) {
        setLanguages(prev => [...prev, formData.language.trim()]);
      }
    }
    
    setShowModal(false);
    setEditingItem(null);
  };

  const deleteItem = (type: 'work' | 'education' | 'skill' | 'language', id: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            if (type === 'work') {
              setWorkExperience(prev => prev.filter(item => item.id !== id));
            } else if (type === 'education') {
              setEducation(prev => prev.filter(item => item.id !== id));
            } else if (type === 'skill') {
              setSkills(prev => prev.filter(skill => skill !== id));
            } else if (type === 'language') {
              setLanguages(prev => prev.filter(lang => lang !== id));
            }
          }
        }
      ]
    );
  };

  const saveProfile = async () => {
    if (!authUser?.id || !profileData) {
      Alert.alert('Error', 'No profile data to save');
      return;
    }

    try {
      const updatedProfile = {
        name: profileData.name,
        bio: aboutText,
        skills: skills,
        // Add other fields as needed
      };
      
      await userAPI.updateProfile(authUser.id, updatedProfile);
      Alert.alert('Success', 'Profile updated successfully!');
      await loadProfileData(); // Reload to get latest data
    } catch (error: any) {
      console.error('❌ Profile update error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update profile');
    }
  };

  const handleUploadResume = async () => {
    try {
      // Pick document
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      console.log('📄 Document picker result:', result);

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      
      // Validate file size (max 5MB)
      if (file.size && file.size > 5 * 1024 * 1024) {
        Alert.alert('Error', 'File size must be less than 5MB');
        return;
      }

      // Show loading
      Alert.alert('Uploading', 'Processing your resume with AI...');

      // Upload to backend
      console.log('📤 Uploading resume:', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType,
      });

      const response = await resumeAPI.uploadResume(
        file.uri,
        file.name,
        file.mimeType || 'application/pdf'
      );

      console.log('✅ Resume upload response:', response);

      // Reload profile to get extracted data
      await loadProfileData();

      Alert.alert(
        'Success',
        'Resume uploaded and processed! Your profile has been updated with extracted information.',
        [{ text: 'OK' }]
      );

    } catch (error: any) {
      console.error('❌ Resume upload error:', error);
      Alert.alert(
        'Upload Failed',
        error.response?.data?.detail || error.message || 'Failed to upload resume'
      );
    }
  };

  const handleEditProfile = () => {
    // Navigate to profile editing sections
    Alert.alert(
      'Edit Profile',
      'Choose what you want to edit:',
      [
        {
          text: 'Personal Info',
          onPress: () => router.push('/(profile)/personal' as any),
        },
        {
          text: 'Education',
          onPress: () => router.push('/(profile)/education' as any),
        },
        {
          text: 'Skills',
          onPress: () => router.push('/(profile)/skills' as any),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  if (loading && !profileData) {
    return (
      <View style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Section with Background */}
        <View style={styles.profileSectionWrapper}>
          {/* Background ProfileCard */}
          <View style={styles.profileCardBackground}>
            <ProfileCard />
          </View>
          
          {/* Header - Positioned absolutely on top */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsButton} onPress={handleEditProfile}>
              <Ionicons name="pencil" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Profile Content - Positioned absolutely on top */}
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              <View style={styles.profileImage}>
                <Text style={styles.profileImageText}>
                  {profileData?.name?.charAt(0).toUpperCase() || '👤'}
                </Text>
              </View>
            </View>
            <Text style={styles.profileName}>{profileData?.name || 'User'}</Text>
            <Text style={styles.profileLocation}>
              {profileData?.location || 'Location not set'}
            </Text>
            
            <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
              <Text style={styles.editProfileText}>Edit profile</Text>
              <Ionicons name="pencil" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Resume Upload Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="cloud-upload-outline" size={20} color="#4285F4" />
              <Text style={styles.sectionTitle}>Upload Resume</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.uploadButton} onPress={handleUploadResume}>
            <Ionicons name="document-text-outline" size={32} color="#4285F4" />
            <Text style={styles.uploadButtonText}>Upload PDF or DOCX</Text>
            <Text style={styles.uploadButtonSubtext}>AI will extract your information automatically</Text>
          </TouchableOpacity>
        </View>

        {/* Contact Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="mail-outline" size={20} color="#4285F4" />
              <Text style={styles.sectionTitle}>Contact Information</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="mail" size={16} color="#666" />
            <Text style={styles.infoText}>{profileData?.email || 'Not provided'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="call" size={16} color="#666" />
            <Text style={styles.infoText}>{profileData?.phone || 'Not provided'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="location" size={16} color="#666" />
            <Text style={styles.infoText}>{profileData?.location || 'Not provided'}</Text>
          </View>
        </View>

        {/* About Me Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="person-circle-outline" size={20} color="#4285F4" />
              <Text style={styles.sectionTitle}>About me</Text>
            </View>
            <TouchableOpacity onPress={() => setEditingSection(editingSection === 'about' ? null : 'about')}>
              <Ionicons name="pencil" size={16} color="#4285F4" />
            </TouchableOpacity>
          </View>
          
          {editingSection === 'about' ? (
            <View>
              <TextInput
                style={styles.textArea}
                value={aboutText}
                onChangeText={setAboutText}
                multiline
                numberOfLines={4}
              />
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={() => {
                  setEditingSection(null);
                  saveProfile();
                }}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.aboutText}>{aboutText}</Text>
          )}
        </View>

        {/* Skills Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialIcons name="psychology" size={20} color="#4285F4" />
              <Text style={styles.sectionTitle}>Skills</Text>
            </View>
            <TouchableOpacity onPress={() => openEditModal('skill')}>
              <Ionicons name="pencil" size={16} color="#4285F4" />
            </TouchableOpacity>
          </View>
          
          {skills.length > 0 ? (
            <View style={styles.skillsContainer}>
              {skills.slice(0, 5).map((skill, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.skillChip}
                  onLongPress={() => deleteItem('skill', skill)}
                >
                  <Text style={styles.skillText}>{skill}</Text>
                </TouchableOpacity>
              ))}
              {skills.length > 5 && (
                <TouchableOpacity style={styles.moreSkillsChip}>
                  <Text style={styles.moreSkillsText}>+{skills.length - 5} more</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Text style={styles.emptyText}>No skills added yet. Upload resume or add manually.</Text>
          )}
          
          {skills.length > 5 && (
            <TouchableOpacity style={styles.seeMoreButton}>
              <Text style={styles.seeMoreText}>See all skills</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Experience Section */}
        {(profileData?.experience_level || profileData?.experience_years) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="briefcase-outline" size={20} color="#4285F4" />
                <Text style={styles.sectionTitle}>Experience</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="trending-up" size={16} color="#666" />
              <Text style={styles.infoText}>
                {profileData.experience_level || 'Not specified'} 
                {profileData.experience_years ? ` • ${profileData.experience_years} years` : ''}
              </Text>
            </View>
          </View>
        )}

        {/* Work Experience Section */}
        {workExperience.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="briefcase-outline" size={20} color="#4285F4" />
                <Text style={styles.sectionTitle}>Work experience</Text>
              </View>
              <TouchableOpacity onPress={() => openEditModal('work')}>
                <Ionicons name="add" size={20} color="#4285F4" />
              </TouchableOpacity>
            </View>
            
            {workExperience.map((work) => (
              <View key={work.id} style={styles.experienceItem}>
                <View style={styles.experienceHeader}>
                  <Text style={styles.experienceTitle}>{work.position}</Text>
                  <TouchableOpacity onPress={() => openEditModal('work', work)}>
                    <Ionicons name="pencil" size={16} color="#4285F4" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.experienceCompany}>{work.company}</Text>
                <Text style={styles.experienceDuration}>{work.duration} • {work.years}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Education Section */}
        {education.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="school-outline" size={20} color="#4285F4" />
                <Text style={styles.sectionTitle}>Education</Text>
              </View>
              <TouchableOpacity onPress={() => openEditModal('education')}>
                <Ionicons name="add" size={20} color="#4285F4" />
              </TouchableOpacity>
            </View>
            
            {education.map((edu) => (
              <View key={edu.id} style={styles.experienceItem}>
                <View style={styles.experienceHeader}>
                  <Text style={styles.experienceTitle}>{edu.degree}</Text>
                  <TouchableOpacity onPress={() => openEditModal('education', edu)}>
                    <Ionicons name="pencil" size={16} color="#4285F4" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.experienceCompany}>{edu.institution}</Text>
                <Text style={styles.experienceDuration}>{edu.duration} • {edu.years}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Social Links Section */}
        {(profileData?.linkedin || profileData?.github || profileData?.portfolio) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="link-outline" size={20} color="#4285F4" />
                <Text style={styles.sectionTitle}>Social Links</Text>
              </View>
            </View>
            
            {profileData.linkedin && (
              <View style={styles.infoRow}>
                <Ionicons name="logo-linkedin" size={16} color="#0077B5" />
                <Text style={styles.linkText}>{profileData.linkedin}</Text>
              </View>
            )}
            
            {profileData.github && (
              <View style={styles.infoRow}>
                <Ionicons name="logo-github" size={16} color="#333" />
                <Text style={styles.linkText}>{profileData.github}</Text>
              </View>
            )}
            
            {profileData.portfolio && (
              <View style={styles.infoRow}>
                <Ionicons name="globe-outline" size={16} color="#4285F4" />
                <Text style={styles.linkText}>{profileData.portfolio}</Text>
              </View>
            )}
          </View>
        )}

        {/* Languages Section */}
        {languages.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="language-outline" size={20} color="#4285F4" />
                <Text style={styles.sectionTitle}>Language</Text>
              </View>
              <TouchableOpacity onPress={() => openEditModal('language')}>
                <Ionicons name="pencil" size={16} color="#4285F4" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.skillsContainer}>
              {languages.map((language, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.skillChip}
                  onLongPress={() => deleteItem('language', language)}
                >
                  <Text style={styles.skillText}>{language}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Resume Section */}
        {resumes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="document-text-outline" size={20} color="#4285F4" />
                <Text style={styles.sectionTitle}>Resume</Text>
              </View>
              <TouchableOpacity onPress={handleUploadResume}>
                <Ionicons name="add" size={20} color="#4285F4" />
              </TouchableOpacity>
            </View>
            
            {resumes.map((resume) => (
              <View key={resume.id} style={styles.resumeItem}>
                <View style={styles.resumeIcon}>
                  <Text style={styles.resumeIconText}>📄</Text>
                </View>
                <View style={styles.resumeInfo}>
                  <Text style={styles.resumeTitle}>{resume.name}</Text>
                  <Text style={styles.resumeDetails}>{resume.size} • {resume.uploadDate}</Text>
                </View>
                <TouchableOpacity style={styles.deleteButton}>
                  <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Sign Out Button */}
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={() => {
            Alert.alert(
              'Sign Out',
              'Are you sure you want to sign out?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Sign Out', 
                  style: 'destructive',
                  onPress: async () => {
                    await signOut();
                    router.replace('/(auth)/signin');
                  }
                }
              ]
            );
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF6B6B" style={{ marginRight: 8 }} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Modal for adding/editing items */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingItem ? 'Edit' : 'Add'} {modalType === 'work' ? 'Work Experience' : 
               modalType === 'education' ? 'Education' : 
               modalType === 'skill' ? 'Skill' : 'Language'}
            </Text>
            <TouchableOpacity onPress={handleSaveItem}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            {modalType === 'work' && (
              <>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Position"
                  value={formData.position}
                  onChangeText={(text) => setFormData({...formData, position: text})}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Company"
                  value={formData.company}
                  onChangeText={(text) => setFormData({...formData, company: text})}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Duration (e.g., Jan 2015 - Feb 2022)"
                  value={formData.duration}
                  onChangeText={(text) => setFormData({...formData, duration: text})}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Years (e.g., 5 Years)"
                  value={formData.years}
                  onChangeText={(text) => setFormData({...formData, years: text})}
                />
              </>
            )}
            
            {modalType === 'education' && (
              <>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Degree"
                  value={formData.degree}
                  onChangeText={(text) => setFormData({...formData, degree: text})}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Institution"
                  value={formData.institution}
                  onChangeText={(text) => setFormData({...formData, institution: text})}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Duration (e.g., Sep 2010 - Aug 2013)"
                  value={formData.duration}
                  onChangeText={(text) => setFormData({...formData, duration: text})}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Years (e.g., 3 Years)"
                  value={formData.years}
                  onChangeText={(text) => setFormData({...formData, years: text})}
                />
              </>
            )}
            
            {modalType === 'skill' && (
              <TextInput
                style={styles.modalInput}
                placeholder="Skill (e.g., JavaScript, Python, React)"
                value={formData.skill}
                onChangeText={(text) => setFormData({...formData, skill: text})}
              />
            )}
            
            {modalType === 'language' && (
              <TextInput
                style={styles.modalInput}
                placeholder="Language (e.g., English, Spanish)"
                value={formData.language}
                onChangeText={(text) => setFormData({...formData, language: text})}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Floating Save Button */}
      <TouchableOpacity style={styles.floatingButton} onPress={saveProfile}>
        <Ionicons name="checkmark" size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  scrollContainer: {
    flex: 1,
  },
  
  // Profile Section Wrapper
  profileSectionWrapper: {
    position: 'relative',
    height: 320,
    overflow: 'hidden',
  },
  
  // Profile Card Background
  profileCardBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  
  // Header Styles - Absolutely positioned on top
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  settingsButton: {
    padding: 8,
  },
  
  // Profile Section Styles - Absolutely positioned on top
  profileSection: {
    position: 'absolute',
    top: 90,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 30,
    zIndex: 5,
  },
  profileImageContainer: {
    marginBottom: 15,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImageText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 5,
  },
  profileLocation: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.8,
    marginBottom: 20,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editProfileText: {
    color: '#FFF',
    marginRight: 8,
    fontSize: 16,
  },
  
  // Section Styles
  section: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginLeft: 8,
  },
  
  // Upload Button
  uploadButton: {
    borderWidth: 2,
    borderColor: '#4285F4',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#F8FBFF',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4285F4',
    marginTop: 10,
  },
  uploadButtonSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  
  // Info Row
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  linkText: {
    fontSize: 14,
    color: '#4285F4',
    marginLeft: 12,
    flex: 1,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  
  // About Section
  aboutText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#4285F4',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Experience Item Styles
  experienceItem: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  experienceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  experienceCompany: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  experienceDuration: {
    fontSize: 12,
    color: '#999',
  },
  
  // Skills Styles
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  skillChip: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  skillText: {
    fontSize: 14,
    color: '#333',
  },
  moreSkillsChip: {
    backgroundColor: '#E3F2FD',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    marginBottom: 10,
  },
  moreSkillsText: {
    fontSize: 14,
    color: '#4285F4',
    fontWeight: '600',
  },
  seeMoreButton: {
    alignSelf: 'center',
    marginTop: 10,
  },
  seeMoreText: {
    fontSize: 14,
    color: '#4285F4',
    fontWeight: '600',
  },
  
  // Resume Styles
  resumeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  resumeIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFE5E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  resumeIconText: {
    fontSize: 20,
  },
  resumeInfo: {
    flex: 1,
  },
  resumeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 3,
  },
  resumeDetails: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
  
  // Sign Out Button
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingTop: 50,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
  },
  modalSaveText: {
    fontSize: 16,
    color: '#4285F4',
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  
  // Floating Button
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  bottomPadding: {
    height: 100,
  },
});
