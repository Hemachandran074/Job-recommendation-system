import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useProfile } from '../contexts/ProfileContext';
import profileAPI from '../utils/api';
import React from 'react';
import ProfileCard from '../components/ui/ProfileCard';

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

export default function Settings() {
  const router = useRouter();
  const { profile, setProfile, signOut } = useProfile();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [aboutText, setAboutText] = useState('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Lectus id commodo egestas metus interdum dolor.');
  
  // Work Experience State
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([
    {
      id: '1',
      position: 'Manager',
      company: 'Amazon Inc',
      duration: 'Jan 2015 - Feb 2022',
      years: '5 Years'
    }
  ]);

  // Education State
  const [education, setEducation] = useState<Education[]>([
    {
      id: '1',
      degree: 'Information Technology',
      institution: 'University of Oxford',
      duration: 'Sep 2010 - Aug 2013',
      years: '3 Years'
    }
  ]);

  // Skills State
  const [skills, setSkills] = useState<string[]>([
    'Leadership', 'Teamwork', 'Visioner', 'Target oriented', 'Consistent'
  ]);

  // Languages State
  const [languages, setLanguages] = useState<string[]>([
    'English', 'German', 'Spanish', 'Mandarin', 'Italy'
  ]);

  // Resume State
  const [resumes, setResumes] = useState<Resume[]>([
    {
      id: '1',
      name: 'Jamet kudasi - CV - UI/UX Designer',
      size: '867 Kb',
      uploadDate: '14 Feb 2022 at 11:30 am'
    }
  ]);

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
    try {
      if (!profile) {
        Alert.alert('Error', 'No profile found');
        return;
      }

      const updatedProfile: any = {
        ...profile,
        about: aboutText,
        work_experience: workExperience,
        education_details: education,
        skills: skills,
        languages: languages,
        resumes: resumes
      };
      
      await profileAPI.updateProfile(profile.email, updatedProfile);
      await setProfile(updatedProfile);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
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
            <TouchableOpacity style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Profile Content - Positioned absolutely on top */}
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              <View style={styles.profileImage}>
                <Text style={styles.profileImageText}>👤</Text>
              </View>
            </View>
            <Text style={styles.profileName}>{profile?.name || 'Orlando Diggs'}</Text>
            <Text style={styles.profileLocation}>{profile?.location || 'California, USA'}</Text>
            
            <TouchableOpacity style={styles.editProfileButton}>
              <Text style={styles.editProfileText}>Edit profile</Text>
              <Ionicons name="pencil" size={16} color="#FFF" />
            </TouchableOpacity>
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
                onPress={() => setEditingSection(null)}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.aboutText}>{aboutText}</Text>
          )}
        </View>

        {/* Work Experience Section */}
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
          
          {workExperience.map((work, index) => (
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

        {/* Education Section */}
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
          
          {education.map((edu, index) => (
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

        {/* Skills Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialIcons name="psychology" size={20} color="#4285F4" />
              <Text style={styles.sectionTitle}>Skill</Text>
            </View>
            <TouchableOpacity onPress={() => openEditModal('skill')}>
              <Ionicons name="pencil" size={16} color="#4285F4" />
            </TouchableOpacity>
          </View>
          
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
          
          {skills.length > 5 && (
            <TouchableOpacity style={styles.seeMoreButton}>
              <Text style={styles.seeMoreText}>See more</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Languages Section */}
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

        {/* Resume Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="document-text-outline" size={20} color="#4285F4" />
              <Text style={styles.sectionTitle}>Resume</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="add" size={20} color="#4285F4" />
            </TouchableOpacity>
          </View>
          
          {resumes.map((resume, index) => (
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
                placeholder="Skill"
                value={formData.skill}
                onChangeText={(text) => setFormData({...formData, skill: text})}
              />
            )}
            
            {modalType === 'language' && (
              <TextInput
                style={styles.modalInput}
                placeholder="Language"
                value={formData.language}
                onChangeText={(text) => setFormData({...formData, language: text})}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Save Button */}
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