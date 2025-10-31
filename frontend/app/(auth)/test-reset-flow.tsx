import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

export default function PasswordResetDemo() {
  const router = useRouter();

  const screens = [
    {
      title: 'Forgot Password',
      description: 'Email input and reset request',
      route: '/(auth)/forgot-password',
      icon: 'lock-closed-outline',
    },
    {
      title: 'Check Your Email',
      description: 'Email sent confirmation',
      route: '/(auth)/check-email',
      icon: 'mail-outline',
      params: { email: 'demo@example.com' },
    },
    {
      title: 'Reset Success',
      description: 'Password changed successfully',
      route: '/(auth)/reset-success',
      icon: 'checkmark-circle-outline',
    },
    {
      title: 'Sign In',
      description: 'Back to sign in page',
      route: '/(auth)/signin',
      icon: 'log-in-outline',
    },
  ];

  const navigateToScreen = (screen: any) => {
    if (screen.params) {
      router.push({
        pathname: screen.route as any,
        params: screen.params,
      });
    } else {
      router.push(screen.route as any);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="construct-outline" size={60} color="#3B9EFF" />
          <Text style={styles.title}>Password Reset Flow</Text>
          <Text style={styles.subtitle}>
            Test all password reset screens{'\n'}
            (No backend connection yet)
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          {screens.map((screen, index) => (
            <TouchableOpacity
              key={index}
              style={styles.card}
              onPress={() => navigateToScreen(screen)}
            >
              <View style={styles.cardIcon}>
                <Ionicons name={screen.icon as any} size={32} color="#3B9EFF" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{screen.title}</Text>
                <Text style={styles.cardDescription}>{screen.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#CCC" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={24} color="#3B9EFF" />
          <Text style={styles.infoText}>
            All buttons are functional with proper navigation and validation.
            Backend integration pending.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Back to App</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  cardsContainer: {
    marginBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    marginLeft: 12,
    lineHeight: 20,
  },
  backButton: {
    backgroundColor: '#3B9EFF',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
