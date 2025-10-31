// Profile submission helper
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userAPI } from './api';

export interface ProfileData {
  // Education
  education?: {
    degree?: string;
    institution?: string;
    graduationYear?: string;
    cgpa?: string;
  };
  
  // Skills
  skills?: string[];
  
  // Personal
  personal?: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    bio?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
}

export const submitCompleteProfile = async (profileData: ProfileData) => {
  try {
    const userId = await AsyncStorage.getItem('userId');
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Prepare data for backend
    const backendData = {
      name: profileData.personal?.fullName,
      email: profileData.personal?.email,
      phone: profileData.personal?.phone,
      location: profileData.personal?.location,
      bio: profileData.personal?.bio,
      linkedin: profileData.personal?.linkedin,
      github: profileData.personal?.github,
      portfolio: profileData.personal?.portfolio,
      skills: profileData.skills || [],
      // Add education fields when backend schema supports it
    };

    console.log('📤 Submitting profile data:', backendData);

    // Call backend API to update user profile
    const response = await userAPI.updateProfile(userId, backendData);

    console.log('✅ Profile updated successfully:', response);

    // Mark profile as complete
    await AsyncStorage.setItem('profileComplete', 'true');

    return { success: true, data: response };
  } catch (error: any) {
    console.error('❌ Error submitting profile:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || error.message || 'Failed to submit profile' 
    };
  }
};
