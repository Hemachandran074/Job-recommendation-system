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

    // Prepare data for backend - match Supabase profiles table schema
    const backendData = {
      full_name: profileData.personal?.fullName,
      email: profileData.personal?.email,
      mobile: profileData.personal?.phone, // maps phone to mobile
      location: profileData.personal?.location,
      about: profileData.personal?.bio, // maps bio to about
      skills: profileData.skills || [],
      // Education fields
      degree: profileData.education?.degree,
      stream: profileData.education?.institution, // or create a separate stream field
      graduation_year: profileData.education?.graduationYear,
      // Optional fields can be added later
      // linkedin, github, portfolio not in current schema - would need to be added to profiles table
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
