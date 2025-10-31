import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const JobCard = () => {
  return (
    <LinearGradient
      colors={['#1976F3', '#2E8EFF', '#5BA9FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.textContainer}>
        <Text style={styles.title}>Let’s Find a new job</Text>
        <Text style={styles.subtitle}>Suitable for you</Text>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Read More</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.circleContainer}>
        <View style={[styles.circle, { opacity: 0.2, width: 210, height: 210 }]} />
        <View style={[styles.circle, { opacity: 0.3, width: 170, height: 170 }]} />
        <View style={[styles.circle, { opacity: 0.4, width: 130, height: 130 }]} />
        <View style={[styles.circle, { opacity: 0.6, width: 90, height: 90 }]} />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    margin: 16,
    overflow: 'hidden',
  },
  textContainer: {
    zIndex: 2,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  subtitle: {
    color: '#fff',
    fontSize: 16,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#000',
    fontWeight: '600',
  },
  circleContainer: {
    position: 'absolute',
    right: -30,
    bottom: -20,
    zIndex: 1,
  },
  circle: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: '#fff',
  },
});

export default JobCard;
