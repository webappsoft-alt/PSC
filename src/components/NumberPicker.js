import React, { useState, useRef, useEffect } from "react";
import {View, ScrollView, Dimensions, StyleSheet} from "react-native";
import Text from "./ScaledText";

const { width: screenWidth } = Dimensions.get("window");
const itemWidth = screenWidth / 5;

const NumberPicker = ({ maxNumber = 100, onValueChange }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollViewRef = useRef(null);

  const numbers = Array.from({ length: maxNumber }, (_, i) => i);

  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current.scrollTo({
          x: selectedIndex * itemWidth,
          animated: false,
        });
      }, 100);
    }
  }, []);

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const adjustedOffset = contentOffsetX + itemWidth * 2;
    const index = Math.round(adjustedOffset / itemWidth) - 2;
    const newIndex = Math.max(0, Math.min(index, numbers.length - 1));
    setSelectedIndex(newIndex);

    // Call onValueChange if provided
    if (onValueChange) {
      onValueChange(numbers[newIndex]);
    }
  };

  const getItemStyle = (index) => {
    const distance = Math.abs(selectedIndex - index);

    if (distance === 0) {
      return {
        fontSize: 100,
        color: "#121212",
        fontWeight: "bold",
      };
    } else if (distance === 1) {
      return {
        fontSize: 60,
        color: "#121212A3",
        fontWeight: "600",
      };
    } else if (distance === 2) {
      return {
        fontSize: 20,
        color: "#12121252",
        fontWeight: "400",
      };
    } else {
      return {
        fontSize: 20,
        color: "#12121220",
        fontWeight: "300",
      };
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={itemWidth}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContainer}
        nestedScrollEnabled={true}
        onContentSizeChange={() => {
          if (scrollViewRef.current && selectedIndex === 0) {
            scrollViewRef.current.scrollTo({
              x: 0,
              animated: false,
            });
          }
        }}
      >
        <View style={{ width: itemWidth + 30 }} />

        {numbers.map((number, index) => (
          <View
            key={index}
            style={[
              styles.numberItem,
              { width: index === selectedIndex ? itemWidth + 40 : itemWidth },
            ]}
          >
            <Text style={[styles.numberText, getItemStyle(index)]}>
              {number}
            </Text>
          </View>
        ))}

        <View style={{ width: itemWidth * 2 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 120,
    justifyContent: "center",
    marginVertical: 10,
  },
  scrollContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  numberItem: {
    justifyContent: "center",
    alignItems: "center",
    height: 120,
  },
  numberText: {
    textAlign: "center",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
});

export default NumberPicker;
