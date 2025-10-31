import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userAPI } from '../utils/api';

export default function Profile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  
  // Section expansion states
  const [expandedSections, setExpandedSections] = useState({
    about: false,
    education: false,
    skills: false,
  });
  
  // Edit mode states
  const [editingSection, setEditingSection] = useState<string | null>(null);
  
  // Profile data from backend
  const [profileData, setProfileData] = useState<any>(null);
  
  // Edit form states
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    mobile: '',
    about: '',
    degree: '',
    stream: '',
    graduation_year: '',
    experience: '',
    preferred_city: '',
  });
  
  // Skills management
  const [newSkillInput, setNewSkillInput] = useState('');
  const [newInterestInput, setNewInterestInput] = useState('');
  const [newDomainInput, setNewDomainInput] = useState('');

  // Load profile data on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      console.log('🔍 Loading profile...');
      
      // Get data from AsyncStorage
      const storedUserId = await AsyncStorage.getItem('userId');
      const storedName = await AsyncStorage.getItem('userName');
      const storedEmail = await AsyncStorage.getItem('userEmail');
      
      console.log('📱 AsyncStorage - userId:', storedUserId);
      console.log('📱 AsyncStorage - userName:', storedName);
      console.log('📱 AsyncStorage - userEmail:', storedEmail);
      
      if (storedUserId) {
        setUserId(storedUserId);
        setUserName(storedName || '');
        setUserEmail(storedEmail || '');
        
        // Fetch full profile from backend
        console.log('🌐 Fetching profile from backend for userId:', storedUserId);
        const response = await userAPI.getProfile(storedUserId);
        console.log('✅ Profile response received:', response);
        
        // Backend returns {status: 'ok', data: {...}}, so extract the actual data
        const profileData = response?.data || response;
        console.log('📦 Extracted profile data:', profileData);
        console.log('  📊 Skills:', profileData?.skills);
        console.log('  📚 Education:', profileData?.degree, profileData?.stream, profileData?.graduation_year);
        console.log('  📱 Contact:', profileData?.mobile, profileData?.email);
        console.log('  💼 Experience:', profileData?.experience);
        console.log('  📍 Location:', profileData?.preferred_city);
        
        setProfileData(profileData);
        
        // Initialize edit form with current data
        setEditForm({
          full_name: profileData?.full_name || storedName || '',
          email: profileData?.email || storedEmail || '',
          mobile: profileData?.mobile || '',
          about: profileData?.about || '',
          degree: profileData?.degree || '',
          stream: profileData?.stream || '',
          graduation_year: profileData?.graduation_year || '',
          experience: profileData?.experience || '',
          preferred_city: profileData?.preferred_city || '',
        });
      } else {
        console.log('⚠️ No userId found in AsyncStorage');
        Alert.alert('Error', 'Please sign in again');
        router.push('/(auth)/signin');
      }
    } catch (error: any) {
      console.error('❌ Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }));
  };

  const startEdit = (section: string) => {
    setEditingSection(section);
    // Auto-expand the section when editing
    setExpandedSections(prev => ({ ...prev, [section]: true }));
  };

  const cancelEdit = () => {
    setEditingSection(null);
    // Reset form to current data
    if (profileData) {
      setEditForm({
        full_name: profileData.full_name || userName,
        email: profileData.email || userEmail,
        mobile: profileData.mobile || '',
        about: profileData.about || '',
        degree: profileData.degree || '',
        stream: profileData.stream || '',
        graduation_year: profileData.graduation_year || '',
        experience: profileData.experience || '',
        preferred_city: profileData.preferred_city || '',
      });
    }
  };

  const saveSection = async (section: string) => {
    if (!userId) return;
    
    setSaving(true);
    try {
      let updateData = {};
      
      if (section === 'about') {
        updateData = {
          full_name: editForm.full_name,
          email: editForm.email,
          mobile: editForm.mobile,
          about: editForm.about,
        };
      } else if (section === 'education') {
        updateData = {
          degree: editForm.degree,
          stream: editForm.stream,
          graduation_year: editForm.graduation_year,
          experience: editForm.experience,
          preferred_city: editForm.preferred_city,
        };
      }
      
      console.log('💾 Saving section:', section, 'with data:', updateData);
      const response = await userAPI.updateProfile(userId, updateData);
      
      // Backend returns {status: 'ok', data: {...}}, extract the actual data
      const updatedProfile = response?.data || response;
      console.log('✅ Update response:', updatedProfile);
      
      // Update local state with the complete updated profile
      setProfileData((prev: any) => ({
        ...prev,
        ...updatedProfile,
      }));
      
      // Also update edit form with new values
      setEditForm((prev: any) => ({
        ...prev,
        ...updateData,
      }));
      
      setEditingSection(null);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      console.error('❌ Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const addSkill = async (type: 'skills' | 'interests' | 'technical_domains', value: string) => {
    if (!userId || !value.trim()) return;
    
    try {
      const currentArray = profileData?.[type] || [];
      if (currentArray.includes(value.trim())) {
        Alert.alert('Info', 'This item already exists');
        return;
      }
      
      const updatedArray = [...currentArray, value.trim()];
      
      console.log(`➕ Adding ${type}:`, value);
      const response = await userAPI.updateProfile(userId, {
        [type]: updatedArray,
      });
      
      // Backend returns {status: 'ok', data: {...}}, extract the actual data
      const updatedProfile = response?.data || response;
      
      setProfileData((prev: any) => ({
        ...prev,
        ...updatedProfile,
      }));
      
      // Clear input
      if (type === 'skills') setNewSkillInput('');
      else if (type === 'interests') setNewInterestInput('');
      else setNewDomainInput('');
      
    } catch (error: any) {
      console.error(`❌ Error adding ${type}:`, error);
      Alert.alert('Error', `Failed to add ${type}`);
    }
  };

  const removeSkill = async (type: 'skills' | 'interests' | 'technical_domains', value: string) => {
    if (!userId) return;
    
    try {
      const currentArray = profileData?.[type] || [];
      const updatedArray = currentArray.filter((item: string) => item !== value);
      
      console.log(`➖ Removing ${type}:`, value);
      const response = await userAPI.updateProfile(userId, {
        [type]: updatedArray,
      });
      
      // Backend returns {status: 'ok', data: {...}}, extract the actual data
      const updatedProfile = response?.data || response;
      
      setProfileData((prev: any) => ({
        ...prev,
        ...updatedProfile,
      }));
      
    } catch (error: any) {
      console.error(`❌ Error removing ${type}:`, error);
      Alert.alert('Error', `Failed to remove ${type}`);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace('/(auth)/signin');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
            <Ionicons name="log-out-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header Card */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {userName?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          </View>
          <Text style={styles.profileName}>{userName || 'User'}</Text>
          <Text style={styles.profileEmail}>{userEmail || 'email@example.com'}</Text>
        </View>

        {/* About Me Section */}
        <CollapsibleSection
          title="About Me"
          icon="account-circle-outline"
          iconColor="#FF8C42"
          expanded={expandedSections.about}
          onToggle={() => toggleSection('about')}
          isEditing={editingSection === 'about'}
          onStartEdit={() => startEdit('about')}
        >
          {editingSection === 'about' ? (
            <View style={styles.editContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={editForm.full_name}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, full_name: text }))}
                placeholder="Your full name"
              />
              
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={editForm.email}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
                placeholder="your.email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <Text style={styles.label}>Mobile</Text>
              <TextInput
                style={styles.input}
                value={editForm.mobile}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, mobile: text }))}
                placeholder="Phone number"
                keyboardType="phone-pad"
              />
              
              <Text style={styles.label}>About</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editForm.about}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, about: text }))}
                placeholder="Tell us about yourself..."
                multiline
                numberOfLines={4}
              />
              
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cancelButton} onPress={cancelEdit}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.saveButton} 
                  onPress={() => saveSection('about')}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.viewContainer}>
              <Text style={styles.contentText}>
                {profileData?.about || 'No bio added yet. Click + to add your professional summary.'}
              </Text>
              {profileData?.email && (
                <View style={styles.infoRow}>
                  <Ionicons name="mail" size={16} color="#666" />
                  <Text style={styles.infoText}>{profileData.email}</Text>
                </View>
              )}
              {profileData?.mobile && (
                <View style={styles.infoRow}>
                  <Ionicons name="call" size={16} color="#666" />
                  <Text style={styles.infoText}>{profileData.mobile}</Text>
                </View>
              )}
            </View>
          )}
        </CollapsibleSection>

        {/* Education Section */}
        <CollapsibleSection
          title="Education & Career"
          icon="school-outline"
          iconColor="#4A90E2"
          expanded={expandedSections.education}
          onToggle={() => toggleSection('education')}
          isEditing={editingSection === 'education'}
          onStartEdit={() => startEdit('education')}
        >
          {editingSection === 'education' ? (
            <View style={styles.editContainer}>
              <Text style={styles.label}>Degree</Text>
              <TextInput
                style={styles.input}
                value={editForm.degree}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, degree: text }))}
                placeholder="e.g., B.Tech, MBA"
              />
              
              <Text style={styles.label}>Stream/Specialization</Text>
              <TextInput
                style={styles.input}
                value={editForm.stream}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, stream: text }))}
                placeholder="e.g., Computer Science, Marketing"
              />
              
              <Text style={styles.label}>Graduation Year</Text>
              <TextInput
                style={styles.input}
                value={editForm.graduation_year}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, graduation_year: text }))}
                placeholder="e.g., 2025"
                keyboardType="numeric"
              />
              
              <Text style={styles.label}>Experience Level</Text>
              <TextInput
                style={styles.input}
                value={editForm.experience}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, experience: text }))}
                placeholder="e.g., 0-1 years, 1-3 years"
              />
              
              <Text style={styles.label}>Preferred City</Text>
              <TextInput
                style={styles.input}
                value={editForm.preferred_city}
                onChangeText={(text) => setEditForm(prev => ({ ...prev, preferred_city: text }))}
                placeholder="e.g., Coimbatore, Chennai"
              />
              
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cancelButton} onPress={cancelEdit}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.saveButton} 
                  onPress={() => saveSection('education')}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.viewContainer}>
              {profileData?.degree && (
                <View style={styles.educationItem}>
                  <Text style={styles.educationDegree}>{profileData.degree}</Text>
                  {profileData.stream && (
                    <Text style={styles.educationStream}>{profileData.stream}</Text>
                  )}
                  {profileData.graduation_year && (
                    <Text style={styles.educationYear}>Graduating {profileData.graduation_year}</Text>
                  )}
                </View>
              )}
              {profileData?.experience && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="briefcase-outline" size={16} color="#666" />
                  <Text style={styles.infoText}>{profileData.experience} experience</Text>
                </View>
              )}
              {profileData?.preferred_city && (
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={styles.infoText}>{profileData.preferred_city}</Text>
                </View>
              )}
              {!profileData?.degree && !profileData?.experience && (
                <Text style={styles.emptyText}>No education details added. Click + to add.</Text>
              )}
            </View>
          )}
        </CollapsibleSection>

        {/* Skills Section */}
        <CollapsibleSection
          title="Skills & Interests"
          icon="star-outline"
          iconColor="#10B981"
          expanded={expandedSections.skills}
          onToggle={() => toggleSection('skills')}
          isEditing={editingSection === 'skills'}
          onStartEdit={() => startEdit('skills')}
        >
          <View style={styles.viewContainer}>
            {/* Skills */}
            <View style={styles.skillCategory}>
              <Text style={styles.skillCategoryTitle}>Technical Skills</Text>
              {editingSection === 'skills' && (
                <View style={styles.addSkillRow}>
                  <TextInput
                    style={[styles.input, styles.addSkillInput]}
                    value={newSkillInput}
                    onChangeText={setNewSkillInput}
                    placeholder="Add a skill"
                  />
                  <TouchableOpacity 
                    onPress={() => addSkill('skills', newSkillInput)}
                    style={styles.addIconButton}
                  >
                    <Ionicons name="add-circle" size={32} color="#4A90E2" />
                  </TouchableOpacity>
                </View>
              )}
              {profileData?.skills && profileData.skills.length > 0 ? (
                <View style={styles.skillsContainer}>
                  {profileData.skills.map((skill: string, index: number) => (
                    <View key={index} style={styles.skillChip}>
                      <Text style={styles.skillText}>{skill}</Text>
                      {editingSection === 'skills' && (
                        <TouchableOpacity 
                          onPress={() => removeSkill('skills', skill)}
                          style={styles.removeButton}
                        >
                          <Ionicons name="close-circle" size={18} color="#666" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No skills added yet</Text>
              )}
            </View>

            {/* Interests */}
            <View style={styles.skillCategory}>
              <Text style={styles.skillCategoryTitle}>Interests</Text>
              {editingSection === 'skills' && (
                <View style={styles.addSkillRow}>
                  <TextInput
                    style={[styles.input, styles.addSkillInput]}
                    value={newInterestInput}
                    onChangeText={setNewInterestInput}
                    placeholder="Add an interest"
                  />
                  <TouchableOpacity 
                    onPress={() => addSkill('interests', newInterestInput)}
                    style={styles.addIconButton}
                  >
                    <Ionicons name="add-circle" size={32} color="#10B981" />
                  </TouchableOpacity>
                </View>
              )}
              {profileData?.interests && profileData.interests.length > 0 ? (
                <View style={styles.skillsContainer}>
                  {profileData.interests.map((interest: string, index: number) => (
                    <View key={index} style={[styles.skillChip, styles.interestChip]}>
                      <Text style={styles.skillText}>{interest}</Text>
                      {editingSection === 'skills' && (
                        <TouchableOpacity 
                          onPress={() => removeSkill('interests', interest)}
                          style={styles.removeButton}
                        >
                          <Ionicons name="close-circle" size={18} color="#666" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No interests added yet</Text>
              )}
            </View>

            {/* Technical Domains */}
            <View style={styles.skillCategory}>
              <Text style={styles.skillCategoryTitle}>Technical Domains</Text>
              {editingSection === 'skills' && (
                <View style={styles.addSkillRow}>
                  <TextInput
                    style={[styles.input, styles.addSkillInput]}
                    value={newDomainInput}
                    onChangeText={setNewDomainInput}
                    placeholder="Add a domain"
                  />
                  <TouchableOpacity 
                    onPress={() => addSkill('technical_domains', newDomainInput)}
                    style={styles.addIconButton}
                  >
                    <Ionicons name="add-circle" size={32} color="#FF8C42" />
                  </TouchableOpacity>
                </View>
              )}
              {profileData?.technical_domains && profileData.technical_domains.length > 0 ? (
                <View style={styles.skillsContainer}>
                  {profileData.technical_domains.map((domain: string, index: number) => (
                    <View key={index} style={[styles.skillChip, styles.domainChip]}>
                      <Text style={styles.skillText}>{domain}</Text>
                      {editingSection === 'skills' && (
                        <TouchableOpacity 
                          onPress={() => removeSkill('technical_domains', domain)}
                          style={styles.removeButton}
                        >
                          <Ionicons name="close-circle" size={18} color="#666" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No domains added yet</Text>
              )}
            </View>

            {editingSection === 'skills' && (
              <TouchableOpacity 
                style={[styles.saveButton, { width: '100%', marginTop: 16 }]} 
                onPress={() => setEditingSection(null)}
              >
                <Text style={styles.saveButtonText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        </CollapsibleSection>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

interface CollapsibleSectionProps {
  title: string;
  icon: string;
  iconColor: string;
  expanded: boolean;
  onToggle: () => void;
  isEditing: boolean;
  onStartEdit: () => void;
  children: React.ReactNode;
}

const CollapsibleSection = ({
  title,
  icon,
  iconColor,
  expanded,
  onToggle,
  isEditing,
  onStartEdit,
  children,
}: CollapsibleSectionProps) => (
  <View style={styles.sectionCard}>
    <TouchableOpacity 
      style={styles.sectionHeader} 
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.sectionTitleContainer}>
        <View style={[styles.iconCircle, { backgroundColor: `${iconColor}20` }]}>
          <MaterialCommunityIcons name={icon as any} size={24} color={iconColor} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionActions}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={(e) => {
            e.stopPropagation();
            onStartEdit();
          }}
        >
          <Ionicons 
            name={isEditing ? "close" : "add"} 
            size={24} 
            color={isEditing ? "#EF4444" : iconColor} 
          />
        </TouchableOpacity>
        <Ionicons 
          name={expanded ? "chevron-up" : "chevron-down"} 
          size={24} 
          color="#999" 
        />
      </View>
    </TouchableOpacity>
    
    {expanded && (
      <View style={styles.sectionContent}>
        {children}
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#4A90E2',
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
  },
  signOutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  profileHeaderCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    marginTop: -20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 15,
    color: '#666',
  },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButton: {
    padding: 4,
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  editContainer: {
    paddingTop: 8,
  },
  viewContainer: {
    paddingTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#FFF',
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  contentText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 15,
    color: '#666',
  },
  educationItem: {
    marginBottom: 16,
  },
  educationDegree: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  educationStream: {
    fontSize: 15,
    color: '#666',
    marginBottom: 2,
  },
  educationYear: {
    fontSize: 14,
    color: '#999',
  },
  skillCategory: {
    marginBottom: 20,
  },
  skillCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  addSkillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  addSkillInput: {
    flex: 1,
    marginBottom: 0,
  },
  addIconButton: {
    marginLeft: 8,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  interestChip: {
    backgroundColor: '#D1FAE5',
  },
  domainChip: {
    backgroundColor: '#FFF7ED',
  },
  skillText: {
    fontSize: 14,
    color: '#2D3748',
    fontWeight: '500',
  },
  removeButton: {
    padding: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});
