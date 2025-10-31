import { Slot } from 'expo-router';
import { ProfileProvider } from '../contexts/ProfileContext';
import React from 'react';

export default function RootLayout() {
  return (
    <ProfileProvider>
      <Slot />
    </ProfileProvider>
  );
}
