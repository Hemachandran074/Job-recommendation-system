import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    title: 'Find your suitable\ninternship now',
    icon: require('../../assets/images/categories/Search.png'),
  },
  {
    title: 'Get the internship\nto your nearest\nlocation',
    icon: require('../../assets/images/categories/Location.png'),
  },
  {
    title: 'Get the opportunities\nfrom multiple media',
    icon: require('../../assets/images/categories/Social-Media.png'),
  },
];

export default function Welcome() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.push('/(auth)/signin');
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.illustrationContainer}>
            <Image
              source={onboardingData[currentIndex].icon}
              style={styles.illustration}
              resizeMode="contain"
            />
        </View>


        <Text style={styles.title}>{onboardingData[currentIndex].title}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.pagination}>
          <TouchableOpacity
            onPress={goToPrevious}
            style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
            disabled={currentIndex === 0}
          >
            <Ionicons name="arrow-back" size={24} color={currentIndex === 0 ? '#CCC' : '#666'} />
          </TouchableOpacity>

          <View style={styles.dotsContainer}>
            {onboardingData.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentIndex ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>

          <TouchableOpacity onPress={goToNext} style={styles.navButton}>
            <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 200,
    height: 200,
    backgroundColor: '#F0F8FF',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    lineHeight: 32,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B9EFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#F0F0F0',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 40,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#000',
  },
  dotInactive: {
    backgroundColor: '#DDD',
  },
  illustrationContainer: {
  width: 250,
  height: 250,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 48,
},
illustration: {
  width: '100%',
  height: '100%',
},

});
