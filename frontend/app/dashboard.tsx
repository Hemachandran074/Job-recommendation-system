import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useProfile } from '../contexts/ProfileContext';
import { jobsAPI, recommendationsAPI, recentJobsAPI, rapidapiAPI } from '../utils/api';
import { Internship } from '../types';
import React from 'react';
import JobCard from '../components/ui/JobCard';

// Import category images
import CompanyIcon from '../assets/images/categories/company-icon.png';
import FullTimeIcon from '../assets/images/categories/fulltime-icon.png';
import PartTimeIcon from '../assets/images/categories/parttime-icon.png';
import InternshipIcon from '../assets/images/categories/internship-icon.png';

export default function Dashboard() {
  const router = useRouter();
  const { profile, signOut } = useProfile();
  const [recommended, setRecommended] = useState<Internship[]>([]);
  const [recent, setRecent] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Internship[]>([]);

  useEffect(() => {
    loadCachedDataOrFetch();
    
    // Set up auto-refresh every 30 minutes (1800000 ms)
    const interval = setInterval(async () => {
      console.log('🔄 Auto-refreshing dashboard jobs (30-minute interval)...');
      await handleRefresh();
    }, 1800000); // 30 minutes
    
    // Cleanup interval on unmount
    return () => {
      clearInterval(interval);
    };
  }, []);

  // Load cached data first, then fetch fresh data only if cache is stale
  const loadCachedDataOrFetch = async () => {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      
      // Try to load cached data from AsyncStorage
      const cachedRecommended = await AsyncStorage.getItem('dashboard_recommended_jobs');
      const cachedRecent = await AsyncStorage.getItem('dashboard_recent_jobs');
      const cachedTimestamp = await AsyncStorage.getItem('dashboard_cache_timestamp');
      
      if (cachedRecommended && cachedRecent && cachedTimestamp) {
        const cacheAge = Date.now() - parseInt(cachedTimestamp);
        const thirtyMinutes = 30 * 60 * 1000;
        
        // Load cached data immediately
        setRecommended(JSON.parse(cachedRecommended));
        setRecent(JSON.parse(cachedRecent));
        setLastFetchTime(new Date(parseInt(cachedTimestamp)));
        setLoading(false);
        
        console.log(`📦 Loaded cached jobs (${Math.floor(cacheAge / 60000)} minutes old)`);
        
        // Only fetch fresh data if cache is older than 30 minutes
        if (cacheAge > thirtyMinutes) {
          console.log('⏰ Cache is stale, fetching fresh data in background...');
          loadData();
        }
      } else {
        // No cache found, fetch fresh data
        console.log('📭 No cache found, fetching fresh data...');
        loadData();
      }
    } catch (error) {
      console.error('❌ Error loading cached data:', error);
      loadData();
    }
  };

  // Handle manual refresh (when user clicks refresh button)
  const handleRefresh = async () => {
    setIsRefreshing(true);
    console.log('🔄 Manual refresh triggered');
    
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const userId = await AsyncStorage.getItem('userId');
    
    // Clear all cache to force fresh data
    try {
      await AsyncStorage.removeItem('dashboard_recommended_jobs');
      await AsyncStorage.removeItem('dashboard_recent_jobs');
      await AsyncStorage.removeItem('dashboard_cache_timestamp');
      console.log('🗑️ Cleared dashboard cache');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
    
    if (userId) {
      try {
        // Force refresh the backend cache (with force: true)
        await jobsAPI.refreshJobCache(userId);
        console.log('✅ Backend cache refreshed');
      } catch (error) {
        console.error('❌ Failed to refresh backend cache:', error);
      }
    }
    
    // Fetch fresh data with forceRefresh flag (will bypass backend cache too)
    await loadData(true);
    setIsRefreshing(false);
  };

  const handleSignOut = async () => {
    // Clear dashboard cache on sign out
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    await AsyncStorage.removeItem('dashboard_recommended_jobs');
    await AsyncStorage.removeItem('dashboard_recent_jobs');
    await AsyncStorage.removeItem('dashboard_cache_timestamp');
    
    await signOut();
    router.replace('/');
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      return;
    }

    setIsSearching(true);
    try {
      console.log('🔍 Searching for:', searchQuery);
      
      // Search in both recommended and recent jobs
      const allJobs = [...recommended, ...recent];
      const results = allJobs.filter(job => 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.skills?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      setSearchResults(results);
      console.log(`✅ Found ${results.length} matching jobs`);
    } catch (error) {
      console.error('❌ Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleJobClick = async (job: Internship) => {
    try {
      console.log('💾 Storing job on click:', job.title);
      
      // Store job in database (or get existing if already stored)
      const response = await jobsAPI.storeJob(job);
      const storedJob = response.job;
      
      console.log(`✅ Job stored/retrieved (ID: ${storedJob.id})`);
      
      // Navigate to job details using the stored job ID
      router.push(`/job-details?id=${storedJob.id}`);
    } catch (error) {
      console.error('❌ Error storing job:', error);
      // Still navigate even if storage fails (fallback)
      router.push(`/job-details?id=${job._id || job.id}`);
    }
  };

  const loadData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // Get user ID for personalized recommendations
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const userId = await AsyncStorage.getItem('userId');

      console.log('📊 Dashboard loading dynamic jobs for user:', userId);
      console.log('👤 User Profile:', profile);
      console.log('🔄 Force refresh:', forceRefresh);

      let recommendedJobs: Internship[] = [];
      let recentJobs: Internship[] = [];

      // ====================================================================
      // 🔥 NEW DYNAMIC JOB FETCHING - Backend handles everything
      // Backend fetches user skills, loops through each, deduplicates, and scores
      // ====================================================================
      if (userId) {
        try {
          console.log('🎯 Fetching personalized job recommendations from backend...');
          
          let jobs = [];
          
          if (forceRefresh) {
            // Skip cache and fetch fresh jobs directly
            console.log('🔥 Force refresh - fetching fresh jobs from Shine.com...');
            const liveResponse = await jobsAPI.getSuggested(userId);
            jobs = liveResponse.data || liveResponse;
            console.log(`✅ Fetched ${jobs.length} fresh jobs from live scraping`);
          } else {
            // Use cached jobs for instant load (backend checks 30-min freshness)
            const cachedResponse = await jobsAPI.getCachedJobs(userId);
            
            // Extract jobs from response (handle both {data: [...]} and direct array)
            jobs = cachedResponse.data || cachedResponse;
            
            if (!Array.isArray(jobs) || jobs.length === 0) {
              console.log('⚠️ No cached jobs, trying live fetch...');
              const liveResponse = await jobsAPI.getSuggested(userId);
              jobs = liveResponse.data || liveResponse;
            }
          }
          
          if (Array.isArray(jobs) && jobs.length > 0) {
            recommendedJobs = jobs;
            console.log(`✅ Loaded ${recommendedJobs.length} personalized jobs (dynamically fetched based on user skills)`);
            console.log(`📊 Jobs sorted by skill match relevance (match_score)`);
            setLastFetchTime(new Date());
          } else {
            console.log('⚠️ No dynamic jobs available, falling back to database recommendations...');
            const recommendedData = await recommendationsAPI.getForUser(userId);
            if (recommendedData.recommendations && recommendedData.recommendations.length > 0) {
              recommendedJobs = recommendedData.recommendations.map((rec: any) => rec.job).slice(0, 10);
              console.log(`📌 Loaded ${recommendedJobs.length} jobs from database (fallback)`);
            }
          }
        } catch (dynamicError: any) {
          console.error('❌ Dynamic job fetching failed:', dynamicError);
          console.log('⚠️ Falling back to database recommendations...');
          
          // Fallback to database recommendations
          try {
            const recommendedData = await recommendationsAPI.getForUser(userId);
            if (recommendedData.recommendations && recommendedData.recommendations.length > 0) {
              recommendedJobs = recommendedData.recommendations.map((rec: any) => rec.job).slice(0, 10);
              console.log(`📌 Loaded ${recommendedJobs.length} jobs from database (fallback)`);
            }
          } catch (fallbackError) {
            console.error('❌ Fallback recommendations also failed:', fallbackError);
          }
        }
      }

      // Load recent jobs from database (for "Recent Jobs" section)
      try {
        console.log('🔍 Fetching recent jobs from database...');
        // Fetch more jobs (up to 100) to have a good pool for "View All"
        const recentData = await jobsAPI.getAllJobs({ limit: 100, skip: 0 });
        console.log('✅ Recent jobs:', recentData.length, 'jobs found');
        
        // Filter to get jobs from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentFiltered = recentData.filter((job: any) => {
          if (!job.created_at) return true;
          const jobDate = new Date(job.created_at);
          return jobDate >= sevenDaysAgo;
        });

        // Remove duplicates - exclude jobs that are in recommended list
        const recommendedIds = new Set(recommendedJobs.map(job => job._id || job.id));
        const uniqueRecent = recentFiltered.filter((job: any) => 
          !recommendedIds.has(job._id || job.id)
        );

        recentJobs = uniqueRecent; // Store ALL recent jobs (no slice)
        console.log(`📌 Filtered to ${recentJobs.length} unique recent jobs (all available)`);
      } catch (recentError: any) {
        console.error('❌ Could not load recent jobs:', recentError);
      }

      // Update state - replace with new jobs (don't append)
      setRecommended(recommendedJobs);
      setRecent(recentJobs);

      // Cache the results in AsyncStorage for next time (reuse AsyncStorage from above)
      // Store ALL jobs so "See All" / "View All" can display them all
      const timestamp = Date.now().toString();
      await AsyncStorage.setItem('dashboard_recommended_jobs', JSON.stringify(recommendedJobs));
      await AsyncStorage.setItem('dashboard_recent_jobs', JSON.stringify(recentJobs));
      await AsyncStorage.setItem('dashboard_cache_timestamp', timestamp);
      console.log(`💾 Cached ${recommendedJobs.length} recommended and ${recentJobs.length} recent jobs in AsyncStorage`);
      
    } catch (error) {
      console.error('❌ Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { 
      name: 'Company', 
      image: CompanyIcon,
      placeholder: '🏢' // Fallback emoji if image fails to load
    },
    { 
      name: 'Full Time', 
      image: FullTimeIcon,
      placeholder: '💼' // Fallback emoji if image fails to load
    },
    { 
      name: 'Part Time', 
      image: PartTimeIcon,
      placeholder: '⏰' // Fallback emoji if image fails to load
    },
    { 
      name: 'Internship', 
      image: InternshipIcon,
      placeholder: '🎓' // Fallback emoji if image fails to load
    }
  ];

  const getCompanyLogo = (companyName: string) => {
    const logos: { [key: string]: string } = {
      'Google': '🔴',
      'Amazon': '🟠', 
      'Microsoft': '🔵',
      'Adobe': '🔴',
      'TCS': '⚪',
      'Infosys': '🔵',
      'Wipro': '🟣',
      'Accenture': '🟣',
      'Flipkart': '🟡',
      'Zomato': '🔴'
    };
    return logos[companyName] || '🏢';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B9EFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.userName}>Hello! {profile?.name} 👋</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={handleRefresh}
              disabled={isRefreshing}
            >
              <Ionicons name="refresh" size={20} color={isRefreshing ? "#999" : "#3B9EFF"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={20} color="#FF4444" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Last Update Indicator */}
        {lastFetchTime && (
          <View style={styles.lastUpdateContainer}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.lastUpdateText}>
              Last updated: {lastFetchTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs, companies, skills..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results */}
        {searchQuery.length > 0 && (
          <View style={styles.searchResultsContainer}>
            {isSearching ? (
              <ActivityIndicator size="small" color="#3B9EFF" style={styles.searchLoader} />
            ) : searchResults.length > 0 ? (
              <>
                <Text style={styles.searchResultsTitle}>
                  Found {searchResults.length} {searchResults.length === 1 ? 'job' : 'jobs'}
                </Text>
                {searchResults.slice(0, 10).map((job) => (
                  <TouchableOpacity
                    key={job._id || job.id}
                    style={styles.searchResultItem}
                    onPress={() => handleJobClick(job)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.searchResultContent}>
                      <Text style={styles.searchResultTitle} numberOfLines={1}>
                        {job.title}
                      </Text>
                      <Text style={styles.searchResultCompany} numberOfLines={1}>
                        {job.company}
                      </Text>
                      {job.location && (
                        <Text style={styles.searchResultLocation} numberOfLines={1}>
                          📍 {job.location}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
                ))}
                {searchResults.length > 10 && (
                  <Text style={styles.moreResultsText}>
                    + {searchResults.length - 10} more results
                  </Text>
                )}
              </>
            ) : (
              <View style={styles.noResultsContainer}>
                <Ionicons name="search-outline" size={48} color="#ccc" />
                <Text style={styles.noResultsText}>No jobs found</Text>
                <Text style={styles.noResultsSubtext}>
                  Try different keywords or browse categories below
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Job Card - Replacing Promotional Banner */}
        <JobCard />

        {/* Browse by Category */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse By Category</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.categoryItem]}
                onPress={() => router.push({
                  pathname: '/job-search',
                  params: { category: category.name }
                })}
                activeOpacity={0.7}
              >
                {category.image ? (
                  <Image 
                    source={category.image} 
                    style={styles.categoryIcon}
                    resizeMode="center"
                    onError={() => console.log(`Failed to load image for ${category.name}`)}
                  />
                ) : (
                  <Text style={styles.categoryPlaceholder}>{category.placeholder}</Text>
                )}
                <Text style={styles.categoryText}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Suggested Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Suggested Jobs</Text>
            <TouchableOpacity onPress={() => {
              router.push({
                pathname: '/job-search',
                params: { 
                  category: 'Suggested Jobs',
                  source: 'suggested',
                  fromDashboard: 'true'
                }
              });
            }}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {recommended.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.jobsHorizontal}>
              {recommended.map((job, index) => (
                <TouchableOpacity
                  key={job._id || `job-${index}`}
                  style={styles.suggestedJobCard}
                  onPress={() => handleJobClick(job)}
                >
                  <View style={styles.jobCardHeader}>
                    <View style={styles.companyLogoContainer}>
                      {job.organization_logo || job.company_logo ? (
                        <Image 
                          source={{ uri: job.organization_logo || job.company_logo }} 
                          style={styles.companyLogoImage}
                          onError={() => console.log('Failed to load company logo')}
                        />
                      ) : (
                        <Text style={styles.companyLogo}>{getCompanyLogo(job.company_name)}</Text>
                      )}
                    </View>
                    <TouchableOpacity style={styles.bookmarkButton}>
                      <Ionicons name="bookmark-outline" size={16} color="#999" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.jobCardTitle}>{job.title}</Text>
                  <Text style={styles.jobCardCompany}>{job.company_name}</Text>
                  <View style={styles.jobCardTags}>
                    <View style={styles.jobTag}>
                      <Text style={styles.jobTagText}>{job.experience_level || 'Entry Level'}</Text>
                    </View>
                    <View style={styles.jobTag}>
                      <Text style={styles.jobTagText}>{job.type}</Text>
                    </View>
                  </View>
                  <View style={styles.jobCardFooter}>
                    <Text style={styles.jobSalary}>{job.salary}</Text>
                    <Text style={styles.jobLocation}>{job.location}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={48} color="#CCC" />
              <Text style={styles.emptyStateText}>No job recommendations yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Complete your profile and we'll find perfect matches for you!
              </Text>
            </View>
          )}
        </View>

        {/* Recent Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Jobs</Text>
            <TouchableOpacity onPress={() => {
              router.push({
                pathname: '/job-search',
                params: { 
                  category: 'Recent Jobs',
                  source: 'recent',
                  fromDashboard: 'true'
                }
              });
            }}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {recent.length > 0 ? (
            recent.slice(0, 4).map((job, index) => (
              <TouchableOpacity
                key={job._id || `recent-${index}`}
                style={styles.recentJobItem}
                onPress={() => handleJobClick(job)}
              >
                <View style={styles.recentJobLeft}>
                  <View style={styles.recentJobLogo}>
                    {job.organization_logo || job.company_logo ? (
                      <Image 
                        source={{ uri: job.organization_logo || job.company_logo }} 
                        style={styles.recentJobLogoImage}
                        onError={() => console.log('Failed to load company logo')}
                      />
                    ) : (
                      <Text style={styles.recentJobLogoText}>{getCompanyLogo(job.company_name)}</Text>
                    )}
                  </View>
                  <View style={styles.recentJobInfo}>
                    <Text style={styles.recentJobTitle}>{job.title}</Text>
                    <Text style={styles.recentJobCompany}>{job.company_name} • {job.location}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.moreButton}>
                  <Ionicons name="ellipsis-vertical" size={16} color="#999" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={48} color="#CCC" />
              <Text style={styles.emptyStateText}>No recent jobs</Text>
              <Text style={styles.emptyStateSubtext}>
                Jobs will appear here once they're added to the database
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'home' && styles.navItemActive]}
          onPress={() => setActiveTab('home')}
        >
          <Ionicons name="home" size={24} color={activeTab === 'home' ? '#000' : '#999'} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'search' && styles.navItemActive]}
          onPress={() => {
            setActiveTab('search');
            router.push('/specializations');
          }}
        >
          <Ionicons name="document-text" size={24} color={activeTab === 'search' ? '#3B9EFF' : '#999'} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'briefcase' && styles.navItemActive]}
          onPress={() => setActiveTab('briefcase')}
        >
          <Ionicons name="briefcase" size={24} color={activeTab === 'briefcase' ? '#3B9EFF' : '#999'} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'profile' && styles.navItemActive]}
          onPress={() => {
            setActiveTab('profile');
            router.push('/profile');
          }}
        >
          <Ionicons name="person" size={24} color={activeTab === 'profile' ? '#3B9EFF' : '#999'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  scrollContainer: { 
    flex: 1 
  },
  loadingContainer: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  
  // Header Styles
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF'
  },
  welcomeText: { 
    fontSize: 16, 
    color: '#666', 
    marginBottom: 4 
  },
  userName: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#000' 
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#F5F5F5', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  
  // Last Update Styles
  lastUpdateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 6,
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#666',
  },
  
  // Search Styles
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F5F5F5', 
    borderRadius: 12, 
    marginHorizontal: 20, 
    marginBottom: 20, 
    paddingHorizontal: 15,
    paddingVertical: 0,
  },
  searchIcon: { 
    marginRight: 10 
  },
  searchInput: { 
    flex: 1, 
    paddingVertical: 12, 
    fontSize: 16, 
    color: '#000' 
  },
  clearButton: {
    padding: 4,
  },
  searchResultsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchLoader: {
    marginVertical: 20,
  },
  searchResultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchResultContent: {
    flex: 1,
    marginRight: 12,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  searchResultCompany: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  searchResultLocation: {
    fontSize: 12,
    color: '#999',
  },
  moreResultsText: {
    fontSize: 14,
    color: '#3B9EFF',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '600',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Promo Banner Styles
  promoBanner: { 
    backgroundColor: '#4285f4ff', 
    borderRadius: 16, 
    marginHorizontal: 20, 
    marginBottom: 30, 
    padding: 20, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  promoContent: { 
    flex: 1 
  },
  promoTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#FFFFFF', 
    lineHeight: 24, 
    marginBottom: 15 
  },
  readMoreButton: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 8, 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    alignSelf: 'flex-start' 
  },
  readMoreText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#4285F4' 
  },
  promoImageContainer: { 
    width: 80, 
    height: 80, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  promoEmoji: { 
    fontSize: 60 
  },
  
  // Section Styles
  section: { 
    marginBottom: 30, 
    paddingHorizontal: 20 
  },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#000', 
    paddingLeft: 5,
    paddingBottom: 20,
  },
  seeAllText: { 
    fontSize: 14, 
    color: '#4285F4', 
    fontWeight: '600' 
  },
  
  // Categories Styles
  categoriesGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  categoryItem: { 
    width: '22%', 
    aspectRatio: 1, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 8 
  },
  categoryText: { 
    fontSize: 12, 
    color: '#666', 
    marginTop: 8, 
    textAlign: 'center' 
  },
  categoryIcon: {
    width: 80,
    height: 50, // This will make the icons match the design better
  },
  categoryPlaceholder: {
    fontSize: 32,
  },
  
  // Suggested Jobs Styles
  jobsHorizontal: { 
    marginLeft: -20 
  },
  suggestedJobCard: { 
    width: 200, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    padding: 16, 
    marginLeft: 20, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    elevation: 4, 
    borderWidth: 1, 
    borderColor: '#F0F0F0' 
  },
  jobCardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  companyLogoContainer: { 
    width: 32, 
    height: 32, 
    borderRadius: 8, 
    backgroundColor: '#F5F5F5', 
    alignItems: 'center', 
    justifyContent: 'center',
    overflow: 'hidden'
  },
  companyLogo: { 
    fontSize: 16 
  },
  companyLogoImage: {
    width: 32,
    height: 32,
    borderRadius: 8
  },
  bookmarkButton: { 
    padding: 4 
  },
  jobCardTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#000', 
    marginBottom: 4 
  },
  jobCardCompany: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 12 
  },
  jobCardTags: { 
    flexDirection: 'row', 
    marginBottom: 12 
  },
  jobTag: { 
    backgroundColor: '#F5F5F5', 
    borderRadius: 6, 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    marginRight: 6 
  },
  jobTagText: { 
    fontSize: 12, 
    color: '#666' 
  },
  jobCardFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  jobSalary: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#000' 
  },
  jobLocation: { 
    fontSize: 12, 
    color: '#666' 
  },
  
  // Recent Jobs Styles
  recentJobItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F0F0F0' 
  },
  recentJobLeft: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  recentJobLogo: { 
    width: 40, 
    height: 40, 
    borderRadius: 8, 
    backgroundColor: '#F5F5F5', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 12,
    overflow: 'hidden'
  },
  recentJobLogoText: { 
    fontSize: 18 
  },
  recentJobLogoImage: {
    width: 40,
    height: 40,
    borderRadius: 8
  },
  recentJobInfo: { 
    flex: 1 
  },
  recentJobTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#000', 
    marginBottom: 2 
  },
  recentJobCompany: { 
    fontSize: 14, 
    color: '#666' 
  },
  moreButton: { 
    padding: 8 
  },
  
  // Empty State Styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Bottom Navigation Styles
  bottomNav: { 
    flexDirection: 'row', 
    backgroundColor: '#FFFFFF', 
    paddingVertical: 16, 
    paddingHorizontal: 24, 
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
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
  
  bottomPadding: { 
    height: 20 
  }
});
