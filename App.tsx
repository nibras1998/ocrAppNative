import React from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import MeterReader from './MeterReader';  // Adjust the path if MeterReader is in a different folder

const App = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <MeterReader />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default App;
