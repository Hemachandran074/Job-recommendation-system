import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { jobsAPI } from '../utils/api';
import React from 'react';

// Job categories with icons
const CATEGORIES = [
  { 
    id: 'design', 
    name: 'Design', 
    icon: 'pen-tool',
    color: '#E3F2FD',
    iconColor: '#2196F3'
  },
  { 
    id: 'data-scientist', 
    name: 'Data Scientist', 
    icon: 'stats-chart',
    color: '#F3E5F5',
    iconColor: '#9C27B0'
  },
  { 
    id: 'ml-engineer', 
    name: 'ML Engineer', 
    icon: 'hardware-chip',
    color: '#E8F5E9',
    iconColor: '#4CAF50'
  },
  { 
    id: 'devops', 
    name: 'DevOps', 
    icon: 'git-network',
    color: '#FFF3E0',
    iconColor: '#FF9800'
  },
  { 
    id: 'cloud-engineer', 
    name: 'Cloud Engineer', 
    icon: 'cloud',
    color: '#E1F5FE',
    iconColor: '#03A9F4'
  },
  { 
    id: 'sde', 
    name: 'SDE', 
    icon: 'code-slash',
    color: '#FCE4EC',
    iconColor: '#E91E63'
  },
];

export default function Specializations() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);

  const filteredCategories = CATEGORIES.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCategoryPress = async (category: typeof CATEGORIES[0]) => {
    try {
      // Get user ID for personalized results
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      const userId = await AsyncStorage.getItem('userId');
      
      // Navigate immediately to job-search page with loading state
      router.push({
        pathname: '/job-search',
        params: { 
          category: category.name,
          fromSpecialization: 'true',
          userId: userId || ''
        }
      });
      
    } catch (error: any) {
      console.error('❌ Error navigating to job search:', error);
      
      Alert.alert(
        'Navigation Error',
        `Could not navigate to job search. Please try again.`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#999" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options-outline" size={24} color="#3B9EFF" />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text style={styles.title}>Specialization</Text>

        {/* Categories Grid - 2 Column Layout */}
        <View style={styles.categoriesGrid}>
          {filteredCategories.map((category, index) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                { backgroundColor: category.color }
              ]}
              onPress={() => handleCategoryPress(category)}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              {loadingCategory === category.id ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={category.iconColor} />
                  <Text style={styles.loadingText}>Scraping...</Text>
                </View>
              ) : (
                <>
                  <View style={[styles.iconContainer, { backgroundColor: '#FFF' }]}>
                    <Ionicons name={category.icon as any} size={40} color={category.iconColor} />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/dashboard')}
        >
          <Ionicons name="home" size={26} color="#999" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
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
    elevation: 3,
  },
  
  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  
  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#E8F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Title
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  
  // Categories Grid - 2 Column Layout
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  leftCard: {
    marginRight: '2%',
  },
  rightCard: {
    marginLeft: '2%',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
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
