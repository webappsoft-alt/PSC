import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { useFontScale } from '../contexts/FontScaleContext';

const ScaledText = React.forwardRef((props, ref) => {
  const { isLargeTextEnabled } = useFontScale();
  const scale = isLargeTextEnabled ? 1.25 : 1;

  // If scaling is disabled, avoid unnecessary style merging
  if (scale === 1) {
    return <RNText ref={ref} {...props} />;
  }

  // Extract base fontSize and lineHeight safely
  const flattenedStyle = StyleSheet.flatten(props.style) || {};
  const currentFontSize = flattenedStyle.fontSize || 14;
  const currentLineHeight = flattenedStyle.lineHeight;

  const dynamicStyle = {
    fontSize: currentFontSize * scale,
    ...(currentLineHeight ? { lineHeight: currentLineHeight * scale } : {})
  };

  return <RNText ref={ref} {...props} style={[props.style, dynamicStyle]} />;
});

export default ScaledText;
