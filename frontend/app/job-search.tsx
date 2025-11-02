import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { jobsAPI } from '../utils/api';
import { Internship } from '../types';
import React from 'react';

// Category to keywords mapping for AI-based filtering
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Design': ['designer', 'ui/ux', 'graphic', 'visual', 'creative', 'frontend', 'web design', 'product design'],
  'Data Scientist': ['data scientist', 'data analyst', 'machine learning', 'ml engineer', 'data engineer', 'analytics', 'big data'],
  'ML Engineer': ['ml engineer', 'machine learning', 'ai engineer', 'deep learning', 'nlp', 'computer vision', 'artificial intelligence'],
  'DevOps': ['devops', 'site reliability', 'sre', 'infrastructure', 'cloud engineer', 'deployment', 'ci/cd', 'kubernetes'],
  'Cloud Engineer': ['cloud engineer', 'aws', 'azure', 'gcp', 'cloud architect', 'cloud infrastructure', 'cloud solutions'],
  'SDE': ['software developer', 'software engineer', 'backend', 'full stack', 'java developer', 'python developer', 'node.js'],
  'Development': ['developer', 'software engineer', 'programmer', 'backend', 'frontend', 'full stack', 'web developer'],
  'Marketing': ['marketing', 'digital marketing', 'content', 'seo', 'social media', 'brand', 'growth'],
  'Sales': ['sales', 'business development', 'account manager', 'sales executive', 'sales representative'],
  'HR': ['human resources', 'hr', 'recruiter', 'talent acquisition', 'people operations', 'hr manager'],
};

export default function JobSearch() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const category = params.category as string || 'All Jobs';
  const source = params.source as string; // 'suggested' or 'recent'
  const fromDashboard = params.fromDashboard === 'true';
  
  const [jobs, setJobs] = useState<Internship[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);

  // Load jobs ONLY on first mount - check if already loaded in this session
  useEffect(() => {
    loadJobsIfNeeded();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchQuery]);

  const loadJobsIfNeeded = async () => {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      
      // If coming from dashboard, load the cached suggested/recent jobs
      if (fromDashboard && source) {
        console.log(`📊 Loading ${source} jobs from dashboard cache`);
        
        const cacheKey = source === 'suggested' ? 'dashboard_recommended_jobs' : 'dashboard_recent_jobs';
        const cachedJobs = await AsyncStorage.getItem(cacheKey);
        
        if (cachedJobs) {
          const dashboardJobs = JSON.parse(cachedJobs);
          console.log(`✅ Loaded ${dashboardJobs.length} ${source} jobs from dashboard`);
          setJobs(dashboardJobs);
          setLastFetchTime(new Date());
          return;
        } else {
          console.warn('⚠️ No cached jobs found, loading fresh...');
        }
      }
      
      const sessionKey = `jobs_session_${category}`;
      const hasLoadedInSession = await AsyncStorage.getItem(sessionKey);
      
      // If we've already loaded in this session and have cache, just load from cache
      if (hasLoadedInSession === 'true') {
        const cachedJobs = await AsyncStorage.getItem(`specialization_jobs_${category}`);
        if (cachedJobs) {
          const scrapedJobs = JSON.parse(cachedJobs);
          console.log(`📦 Restored ${scrapedJobs.length} jobs from session cache`);
          setJobs(scrapedJobs);
          setLastFetchTime(new Date());
          return; // Don't reload, just restore from cache
        }
      }
      
      // Mark that we're loading for this session
      await AsyncStorage.setItem(sessionKey, 'true');
      
      // First time in this session, proceed with normal loading
      loadJobs();
    } catch (error) {
      console.error('Error checking session:', error);
      loadJobs();
    }
  };

  const loadJobs = async () => {
    try {
      console.log('🔍 Loading jobs for category:', category);
      
      // Get AsyncStorage
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const fromSpecialization = params.fromSpecialization === 'true';
      const userId = params.userId as string;
      
      // First, try to load from cache instantly (no loading state)
      const cachedJobs = await AsyncStorage.getItem(`specialization_jobs_${category}`);
      if (cachedJobs && !fromSpecialization) {
        // Load from cache instantly without showing loading
        const scrapedJobs = JSON.parse(cachedJobs);
        console.log(`📦 Instantly loaded ${scrapedJobs.length} cached jobs`);
        setJobs(scrapedJobs);
        setLastFetchTime(new Date());
        return; // Don't show loading, just display cached jobs
      }
      
      // If no cache or coming from specialization, show loading and scrape
      setLoading(true);
      
      // If coming from specialization page, scrape fresh jobs
      if (fromSpecialization) {
        console.log('🌐 Scraping fresh jobs from specialization click...');
        
        try {
          // Call scraping API
          const response = await jobsAPI.getBySpecialization(category, userId || undefined);
          
          if (response.status === 'ok' && response.data && response.data.length > 0) {
            console.log(`✅ Scraped ${response.data.length} jobs for ${category}`);
            
            // Store scraped jobs in AsyncStorage for future use
            await AsyncStorage.setItem(`specialization_jobs_${category}`, JSON.stringify(response.data));
            
            setJobs(response.data);
            setLastFetchTime(new Date());
            return; // Exit early after successful scraping
          } else {
            console.warn('⚠️ Scraping returned no jobs, falling back to cache/database');
          }
        } catch (scrapeError) {
          console.error('❌ Scraping failed, falling back to cache/database:', scrapeError);
        }
      }
      
      // Check cache again (in case scraping failed or we're not from specialization)
      const cachedJobsRetry = await AsyncStorage.getItem(`specialization_jobs_${category}`);
      
      if (cachedJobsRetry) {
        // Use cached scraped jobs from previous scrape
        const scrapedJobs = JSON.parse(cachedJobsRetry);
        console.log(`📦 Loaded ${scrapedJobs.length} cached scraped jobs`);
        setJobs(scrapedJobs);
        setLastFetchTime(new Date());
      } else {
        // Final fallback: Load jobs from database
        console.log('📊 No cached jobs, loading from database...');
        const response = await jobsAPI.getAllJobs({ 
          limit: 50,
          skip: 0
        });
        
        if (response.data && response.data.length > 0) {
          // Filter jobs by category
          const categoryLower = category.toLowerCase();
          const filtered = response.data.filter((job: any) => {
            const title = (job.title || '').toLowerCase();
            const desc = (job.description || '').toLowerCase();
            const skills = (job.skills || []).map((s: string) => s.toLowerCase()).join(' ');
            
            return title.includes(categoryLower) || 
                   desc.includes(categoryLower) || 
                   skills.includes(categoryLower);
          });
          
          setJobs(filtered.length > 0 ? filtered : response.data);
          console.log(`✅ Filtered to ${filtered.length} jobs from database`);
        } else {
          setJobs([]);
        }
        setLastFetchTime(new Date());
      }
      
    } catch (error: any) {
      console.error('❌ Error loading jobs:', error);
      Alert.alert(
        'Error Loading Jobs', 
        'Could not fetch jobs. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh function - forces fresh scraping
  const handleManualRefresh = async () => {
    try {
      setLoading(true);
      console.log('🔄 Manual refresh - scraping fresh jobs...');
      
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const userId = await AsyncStorage.getItem('userId');
      
      // Always scrape fresh jobs on manual refresh
      try {
        const response = await jobsAPI.getBySpecialization(category, userId || undefined);
        
        if (response.status === 'ok' && response.data && response.data.length > 0) {
          console.log(`✅ Refreshed ${response.data.length} jobs for ${category}`);
          
          // Update cache with fresh data
          await AsyncStorage.setItem(`specialization_jobs_${category}`, JSON.stringify(response.data));
          
          setJobs(response.data);
          setLastFetchTime(new Date());
          
          Alert.alert(
            'Jobs Updated',
            `Successfully refreshed ${response.data.length} jobs!`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'No Jobs Found',
            'Could not find jobs for this category. Try again later.',
            [{ text: 'OK' }]
          );
        }
      } catch (scrapeError: any) {
        console.error('❌ Manual refresh failed:', scrapeError);
        Alert.alert(
          'Refresh Failed',
          'Could not scrape fresh jobs. Please check your connection and try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('❌ Error in manual refresh:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    if (!searchQuery.trim()) {
      setFilteredJobs(jobs);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = jobs.filter(job => {
      const title = (job.title || '').toLowerCase();
      const company = (job.company_name || '').toLowerCase();
      const location = (job.location || '').toLowerCase();
      
      return title.includes(query) || 
             company.includes(query) || 
             location.includes(query);
    });

    setFilteredJobs(filtered);
  };

  const handleJobPress = async (job: Internship) => {
    try {
      console.log('💾 Storing job on click:', job.title);
      
      // Store job in database (or get existing if already stored)
      const response = await jobsAPI.storeJob(job);
      const storedJob = response.job;
      
      console.log(`✅ Job stored/retrieved (ID: ${storedJob.id})`);
      
      // Navigate to job details using the stored job ID
      router.push({
        pathname: '/job-details',
        params: { id: storedJob.id }
      });
    } catch (error) {
      console.error('❌ Error storing job:', error);
      // Still navigate even if storage fails (fallback)
      router.push({
        pathname: '/job-details',
        params: { id: job._id || job.id }
      });
    }
  };

  const renderJobCard = (job: Internship) => {
    // Format salary
    let salaryText = '';
    if (job.salary_min && job.salary_max) {
      // Convert to K format (thousands)
      const minK = Math.round(job.salary_min / 1000);
      const maxK = Math.round(job.salary_max / 1000);
      salaryText = `$${minK}K-${maxK}K/Mo`;
    } else if (job.salary) {
      salaryText = job.salary;
    } else {
      salaryText = '$15K/Mo';
    }

    // Format time posted
    const timePosted = job.created_at 
      ? (() => {
          const now = new Date();
          const posted = new Date(job.created_at);
          const diffMs = now.getTime() - posted.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMins / 60);
          const diffDays = Math.floor(diffHours / 24);
          
          if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
          if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
          if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
          return 'Just now';
        })()
      : '25 minute ago';

    // Get first letter for logo
    const logoLetter = (job.company || job.company_name || 'C').charAt(0).toUpperCase();

    return (
      <TouchableOpacity 
        key={job.id || job._id || job.external_id} 
        style={styles.jobCard}
        onPress={() => handleJobPress(job)}
        activeOpacity={0.7}
      >
        {/* Header with Logo and More Button */}
        <View style={styles.cardHeader}>
          <View style={styles.companyLogo}>
            <Text style={styles.logoText}>{logoLetter}</Text>
          </View>
          
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-vertical" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Job Title */}
        <Text style={styles.jobTitle} numberOfLines={2}>{job.title}</Text>
        
        {/* Company Name and Location */}
        <Text style={styles.companyInfo} numberOfLines={1}>
          {job.company || job.company_name} • {job.location || 'Remote'}
        </Text>

        {/* Tags */}
        <View style={styles.tagsContainer}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{category}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{job.job_type || 'Full time'}</Text>
          </View>
          {job.experience && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{job.experience}</Text>
            </View>
          )}
        </View>

        {/* Footer with Time and Salary */}
        <View style={styles.cardFooter}>
          <Text style={styles.timeText}>{timePosted}</Text>
          <Text style={styles.salaryText}>{salaryText}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{category}</Text>
          {lastFetchTime && !loading && (
            <Text style={styles.lastUpdated}>
              Updated {lastFetchTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={handleManualRefresh} style={styles.refreshButton} disabled={loading}>
          <Ionicons 
            name="refresh" 
            size={22} 
            color={loading ? "#CCC" : "#3B9EFF"} 
          />
        </TouchableOpacity>
      </View>

      {/* Loading State - Only show when actually loading */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B9EFF" />
          <Text style={styles.loadingText}>Loading {category} jobs...</Text>
        </View>
      ) : filteredJobs.length === 0 ? (
        /* Empty State */
        <View style={styles.emptyContainer}>
          <Ionicons name="briefcase-outline" size={64} color="#CCC" />
          <Text style={styles.emptyTitle}>No Jobs Found</Text>
          <Text style={styles.emptyText}>
            {searchQuery 
              ? `No jobs match "${searchQuery}"`
              : `No jobs available for ${category} at the moment.`}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleManualRefresh}>
            <Text style={styles.retryButtonText}>Reload</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Job List */
        <ScrollView 
          style={styles.jobsList}
          contentContainerStyle={styles.jobsContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredJobs.map(job => renderJobCard(job))}
        </ScrollView>
      )}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/dashboard')}
        >
          <Ionicons name="home" size={26} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navItem, styles.navItemActive]}
        >
          <Ionicons name="document-text" size={26} color="#3B9EFF" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/dashboard')}
        >
          <Ionicons name="briefcase" size={26} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/profile')}
        >
          <Ionicons name="person" size={26} color="#999" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: '#F8F9FA',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  lastUpdated: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3B9EFF',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  
  // Job List
  jobsList: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  jobsContent: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 100,
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  
  // Job Card
  jobCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  companyLogo: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B9EFF',
  },
  moreButton: {
    padding: 4,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    lineHeight: 24,
  },
  companyName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  companyInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
  },
  salary: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  salaryText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  navItemActive: {
    backgroundColor: '#E8F4FF',
    borderRadius: 16,
  },
});
