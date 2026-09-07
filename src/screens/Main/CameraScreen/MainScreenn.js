import React from 'react';
import {View, StyleSheet} from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Text from "../../../components/ScaledText";

const MainScreenn = ({ navigation }) => {
  const onGestureEvent = (event) => {
    if (event.nativeEvent.translationX > 120) {
      navigation.navigate('Camera');
    }
  };

  return (
    <PanGestureHandler onEnded={onGestureEvent}>
      <View style={styles.container}>
        <Text style={styles.text}>Main Screen</Text>
        <Text style={styles.sub}>Swipe Right to open Camera</Text>
      </View>
    </PanGestureHandler>
  );
};

export default MainScreenn;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '600',
  },
  sub: {
    color: '#94A3B8',
    marginTop: 10,
  },
});
