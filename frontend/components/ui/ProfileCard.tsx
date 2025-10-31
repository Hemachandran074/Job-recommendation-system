import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const ProfileCard = () => {
  return (
    <View style={styles.container}>
      <Svg height="100%" width="100%" viewBox="0 0 1440 320"  preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#8ed1fc" />
            <Stop offset="100%" stopColor="#8ed1fc" />
          </LinearGradient>
        </Defs>

        {/* Layer 1 */}
        <Path
        d="M0,320L0,60C120,40,240,20,360,40C480,60,600,100,720,100C840,100,960,60,1080,60C1200,60,1320,80,1440,100L1440,320L0,320Z"
        fill="#8ed1fc"
        fillOpacity="0.25"
        />

        {/* Layer 2 */}
        <Path
        d="M0,320L0,120C120,100,240,120,360,140C480,160,600,180,720,170C840,160,960,120,1080,120C1200,120,1320,140,1440,150L1440,320L0,320Z"
        fill="#8ed1fc"
        fillOpacity="0.4"
        />

        {/* Layer 3 */}
        <Path
        d="M0,320L0,180C120,200,240,200,360,190C480,180,600,160,720,160C840,160,960,180,1080,180C1200,180,1320,170,1440,160L1440,320L0,320Z"
        fill="#8ed1fc"
        fillOpacity="0.55"
        />

        {/* Layer 4 */}
        <Path
        d="M0,320L0,240C120,230,240,230,360,240C480,250,600,270,720,270C840,270,960,250,1080,240C1200,230,1320,230,1440,240L1440,320L0,320Z"
        fill="#8ed1fc"
        fillOpacity="1"
        />

      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4285f4ff',
    borderRadius: 18, // base background
  },
});

export default ProfileCard;
