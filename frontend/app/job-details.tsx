import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { jobsAPI } from '../utils/api';
import React from 'react';

interface Job {
  _id: string;
  id: string;
  title: string;
  company: string;
  company_name: string;
  company_logo?: string;
  organization_logo?: string;
  linkedin_org_description?: string;
  location: string;
  type: string;
  job_type: string;
  remote: boolean;
  description: string;
  skills: string[];
  salary: string;
  salary_min?: number;
  salary_max?: number;
  experience_level: string;
  url: string;
  created_at: string;
  period: string;
}

export default function JobDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'job'>('job');

  useEffect(() => {
    if (id) {
      loadJob();
    }
  }, [id]);

  const loadJob = async () => {
    try {
      console.log('📋 Loading job details for ID:', id);
      const data = await jobsAPI.getJobDetails(id as string);
      console.log('✅ Job data loaded:', data);
      console.log('📝 Description field:', data.description);
      console.log('📝 LinkedIn Org Description field:', data.linkedin_org_description);
      setJob(data);
    } catch (error) {
      console.error('❌ Error loading job:', error);
    } finally {
      setLoading(false);
    }
  };

  const getJobDescription = (): string => {
    // Priority: linkedin_org_description > description > fallback
    if (job?.linkedin_org_description && job.linkedin_org_description !== 'null') {
      return job.linkedin_org_description;
    }
    if (job?.description && job.description !== 'null' && 
        !job.description.includes('position at') && 
        job.description !== 'No description available') {
      return job.description;
    }
    return `We are looking for a talented ${job?.title || 'professional'} to join our team at ${job?.company_name || 'our company'}. This is an exciting opportunity to work on challenging projects and grow your career. The ideal candidate will have strong problem-solving skills and be passionate about technology.`;
  };

  const getCompanyLogo = (): string => {
    if (job?.organization_logo) return job.organization_logo;
    if (job?.company_logo) return job.company_logo;
    return '';
  };

  const getTimeSincePosted = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const handleApplyNow = () => {
    if (job?.url) {
      Linking.openURL(job.url);
    }
  };

  const handleVisitWebsite = () => {
    if (job?.url) {
      Linking.openURL(job.url);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B9EFF" />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Job not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backToHomeButton}>
          <Text style={styles.backToHomeText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const logoUrl = getCompanyLogo();

  return (
    <View style={styles.container}>
      {/* Header with Background Image */}
      <View style={styles.headerImageContainer}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800' }}
          style={styles.headerImage}
        />
        <View style={styles.headerOverlay}>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.bookmarkButton}
              onPress={() => setIsBookmarked(!isBookmarked)}
            >
              <Ionicons 
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'} 
                size={24} 
                color="#FFF" 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Company Header with Logo */}
        <View style={styles.companyHeader}>
          {logoUrl ? (
            <Image 
              source={{ uri: logoUrl }} 
              style={styles.companyLogo}
              onError={() => console.log('Failed to load company logo')}
            />
          ) : (
            <View style={styles.companyLogoPlaceholder}>
              <Text style={styles.companyLogoText}>
                {job.company_name?.charAt(0).toUpperCase() || 'C'}
              </Text>
            </View>
          )}
          
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.companyInfo}>
            {job.company_name} • {job.location} • {getTimeSincePosted(job.created_at)}
          </Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.followButton}>
              <Ionicons name="add-circle-outline" size={20} color="#3B9EFF" />
              <Text style={styles.followText}>Follow</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.websiteButton} onPress={handleVisitWebsite}>
              <Ionicons name="globe-outline" size={20} color="#3B9EFF" />
              <Text style={styles.websiteText}>Visit website</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'about' && styles.tabActive]}
            onPress={() => setActiveTab('about')}
          >
            <Text style={[styles.tabText, activeTab === 'about' && styles.tabTextActive]}>
              About us
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'job' && styles.tabActive]}
            onPress={() => setActiveTab('job')}
          >
            <Text style={[styles.tabText, activeTab === 'job' && styles.tabTextActive]}>
              About Job
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content Based on Active Tab */}
        {activeTab === 'job' && (
          <>
            {/* Job Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Job Description</Text>
              <Text style={styles.sectionText}>
                {getJobDescription()}
              </Text>
            </View>

            {/* Skills Required */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Skills Required</Text>
              <Text style={styles.sectionText}>
                {job.skills && job.skills.length > 0 
                  ? job.skills.join(', ')
                  : 'Communication, Teamwork, Problem-solving'}
              </Text>
            </View>

            {/* Job Details Grid */}
            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Salary</Text>
              <Text style={styles.detailValue}>{job.salary}</Text>
            </View>

            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Location</Text>
              <Text style={styles.detailValue}>{job.location}</Text>
            </View>

            <View style={styles.detailsSection}>
              <Text style={styles.sectionTitle}>Period</Text>
              <View style={styles.periodContainer}>
                <Text style={styles.detailValue}>{job.period || '2 Months'}</Text>
                <View style={styles.jobTypeBadge}>
                  <Text style={styles.jobTypeBadgeText}>{job.job_type}</Text>
                </View>
              </View>
            </View>
          </>
        )}

        {activeTab === 'about' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Company</Text>
            <Text style={styles.sectionText}>
              {getJobDescription()}
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer with Apply Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.applyButton} onPress={handleApplyNow}>
          <Text style={styles.applyButtonText}>APPLY NOW</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFF' 
  },
  loadingContainer: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  errorContainer: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: 20
  },
  errorText: { 
    fontSize: 16, 
    color: '#666',
    marginBottom: 20
  },
  backToHomeButton: {
    backgroundColor: '#3B9EFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  backToHomeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600'
  },
  
  // Header with Image
  headerImageContainer: {
    height: 200,
    position: 'relative'
  },
  headerImage: {
    width: '100%',
    height: '100%'
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)'
  },
  headerButtons: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 16, 
    paddingTop: 50
  },
  backButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.3)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  bookmarkButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.3)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  
  scrollView: { 
    flex: 1 
  },
  
  // Company Header
  companyHeader: { 
    alignItems: 'center', 
    padding: 24, 
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  companyLogo: { 
    width: 80, 
    height: 80, 
    borderRadius: 40, 
    marginBottom: 16,
    backgroundColor: '#F5F5F5'
  },
  companyLogoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    backgroundColor: '#3B9EFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  companyLogoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF'
  },
  jobTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#000', 
    marginBottom: 8, 
    textAlign: 'center' 
  },
  companyInfo: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 16,
    textAlign: 'center'
  },
  
  // Action Buttons
  actionButtons: { 
    flexDirection: 'row', 
    gap: 12,
    marginTop: 8
  },
  followButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    backgroundColor: '#E3F2FD',
    borderRadius: 8, 
    gap: 8 
  },
  followText: { 
    color: '#3B9EFF', 
    fontWeight: '600',
    fontSize: 14
  },
  websiteButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    backgroundColor: '#E3F2FD',
    borderRadius: 8, 
    gap: 8 
  },
  websiteText: { 
    color: '#3B9EFF', 
    fontWeight: '600',
    fontSize: 14
  },
  
  // Tabs
  tabs: { 
    flexDirection: 'row', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F0F0F0', 
    paddingHorizontal: 24,
    backgroundColor: '#FFF'
  },
  tab: { 
    paddingVertical: 16, 
    marginRight: 24 
  },
  tabActive: { 
    paddingVertical: 16, 
    marginRight: 24, 
    borderBottomWidth: 3, 
    borderBottomColor: '#3B9EFF' 
  },
  tabText: { 
    fontSize: 16, 
    color: '#666',
    fontWeight: '500'
  },
  tabTextActive: { 
    fontSize: 16, 
    color: '#000', 
    fontWeight: 'bold' 
  },
  
  // Content Sections
  section: { 
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5'
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#000', 
    marginBottom: 12 
  },
  sectionText: { 
    fontSize: 14, 
    color: '#666', 
    lineHeight: 22 
  },
  
  // Details Section
  detailsSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5'
  },
  detailValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
    marginTop: 4
  },
  periodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4
  },
  jobTypeBadge: {
    backgroundColor: '#3B9EFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  jobTypeBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600'
  },
  
  // Footer
  footer: { 
    padding: 16, 
    backgroundColor: '#FFF', 
    borderTopWidth: 1, 
    borderTopColor: '#F0F0F0',
    paddingBottom: 32
  },
  applyButton: { 
    backgroundColor: '#3B9EFF', 
    borderRadius: 8, 
    height: 56, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  applyButtonText: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: 'bold',
    letterSpacing: 1
  },
});
