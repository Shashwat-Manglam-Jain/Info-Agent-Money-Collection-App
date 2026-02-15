import { Image, StyleSheet, View } from 'react-native';

import { images } from '../../assets/images';

export function AppSplashScreen() {
  return (
    <View style={styles.root}>
      <Image source={images.splash} resizeMode="cover" style={styles.bg} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#d8dce5' },
  bg: { width: '100%', height: '100%' },
});
