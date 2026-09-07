import { Platform, StyleSheet, View } from "react-native";
import { LinearGradient } from "react-native-linear-gradient";

const EnhancedBlurView = ({
  children,
  style,
  blurType = "light",
  blurIntensity = 1,
  backgroundColor,
  borderRadius = 0,
  blurDirection = "topToBottom",
  animatedBlur = false,
  frostedGlass = true,
  ...props
}) => {
  const getEnhancedBlurLayers = () => {
    const intensity = Math.max(1, Math.min(blurIntensity, 10));
    const baseOpacity = intensity * 0.08;
    const layerCount = Math.min(intensity + 3, 12);

    let colorScheme;
    switch (blurType) {
      case "light":
        colorScheme = {
          primary: `rgba(255, 255, 255, ${baseOpacity + 0.25})`,
          secondary: `rgba(250, 250, 250, ${baseOpacity + 0.2})`,
          tertiary: `rgba(245, 245, 245, ${baseOpacity + 0.15})`,
          accent: `rgba(240, 240, 240, ${baseOpacity + 0.1})`,
          border: `rgba(255, 255, 255, ${intensity * 0.4})`,
          innerBorder: `rgba(255, 255, 255, ${intensity * 0.6})`,
          shadow: `rgba(0, 0, 0, 0.15)`,
          glow: `rgba(255, 255, 255, 0.69)`,
          backdrop: `rgba(255, 255, 255, 0.3)`,
          noise: `rgba(255, 255, 255, 0.08)`,
        };
        break;
      case "dark":
        colorScheme = {
          primary: `rgba(0, 0, 0, ${baseOpacity + 0.4})`,
          secondary: `rgba(15, 15, 15, ${baseOpacity + 0.35})`,
          tertiary: `rgba(25, 25, 25, ${baseOpacity + 0.3})`,
          accent: `rgba(35, 35, 35, ${baseOpacity + 0.25})`,
          border: `rgba(255, 255, 255, ${intensity * 0.2})`,
          innerBorder: `rgba(255, 255, 255, ${intensity * 0.25})`,
          shadow: `rgba(0, 0, 0, 0.6)`,
          glow: `rgba(255, 255, 255, 0.3)`,
          backdrop: `rgba(0, 0, 0, 0.5)`,
          noise: `rgba(255, 255, 255, 0.04)`,
        };
        break;
      case "ultraThin":
        colorScheme = {
          primary: `rgba(255, 255, 255, ${baseOpacity * 0.6})`,
          secondary: `rgba(252, 252, 252, ${baseOpacity * 0.5})`,
          tertiary: `rgba(248, 248, 248, ${baseOpacity * 0.4})`,
          accent: `rgba(245, 245, 245, ${baseOpacity * 0.3})`,
          border: `rgba(255, 255, 255, ${intensity * 0.3})`,
          innerBorder: `rgba(255, 255, 255, ${intensity * 0.4})`,
          shadow: `rgba(0, 0, 0, 0.08)`,
          glow: `rgba(255, 255, 255, 0.7)`,
          backdrop: `rgba(255, 255, 255, 0.2)`,
          noise: `rgba(255, 255, 255, 0.03)`,
        };
        break;
      default:
        colorScheme = {
          primary: `rgba(255, 255, 255, ${baseOpacity + 0.2})`,
          secondary: `rgba(248, 248, 248, ${baseOpacity + 0.15})`,
          tertiary: `rgba(242, 242, 242, ${baseOpacity + 0.12})`,
          accent: `rgba(238, 238, 238, ${baseOpacity + 0.08})`,
          border: `rgba(255, 255, 255, ${intensity * 0.35})`,
          innerBorder: `rgba(255, 255, 255, ${intensity * 0.5})`,
          shadow: `rgba(0, 0, 0, 0.12)`,
          glow: `rgba(255, 255, 255, 0.8)`,
          backdrop: `rgba(255, 255, 255, 0.25)`,
          noise: `rgba(255, 255, 255, 0.05)`,
        };
    }

    return { colorScheme, layerCount, intensity };
  };

  const getDirectionalMask = () => {
    const masks = {
      topToBottom: [
        "rgba(255, 255, 255, 1)", // Top - maximum blur
        "rgba(255, 255, 255, 1)",
        "rgba(255, 255, 255, 0.8)",
        "rgba(255, 255, 255, 0.6)", // Center - blur starts reducing
        "transparent",
        "transparent",
        "transparent", // Bottom - fully transparent
        "transparent", // Completely transparent
      ],
      bottomToTop: [
        "rgba(255, 255, 255, 0)", // Top - clear
        "rgba(255, 255, 255, 0.05)",
        "rgba(255, 255, 255, 0.15)",
        "rgba(255, 255, 255, 0.3)",
        "rgba(255, 255, 255, 0.5)",
        "rgba(255, 255, 255, 0.7)",
        "rgba(255, 255, 255, 0.85)",
        "rgba(255, 255, 255, 1)", // Bottom - maximum blur
      ],
      leftToRight: [
        "rgba(255, 255, 255, 1)", // Left - maximum blur
        "rgba(255, 255, 255, 0.8)",
        "rgba(255, 255, 255, 0.6)",
        "rgba(255, 255, 255, 0.4)",
        "rgba(255, 255, 255, 0.2)",
        "rgba(255, 255, 255, 0.1)",
        "rgba(255, 255, 255, 0)", // Right - clear
      ],
      rightToLeft: [
        "rgba(255, 255, 255, 0)", // Left - clear
        "rgba(255, 255, 255, 0.1)",
        "rgba(255, 255, 255, 0.2)",
        "rgba(255, 255, 255, 0.4)",
        "rgba(255, 255, 255, 0.6)",
        "rgba(255, 255, 255, 0.8)",
        "rgba(255, 255, 255, 1)", // Right - maximum blur
      ],
      diagonal: [
        "rgba(255, 255, 255, 1)", // Top-left - maximum blur
        "rgba(255, 255, 255, 0.75)",
        "rgba(255, 255, 255, 0.5)",
        "rgba(255, 255, 255, 0.3)",
        "rgba(255, 255, 255, 0.15)",
        "rgba(255, 255, 255, 0.05)",
        "rgba(255, 255, 255, 0)", // Bottom-right - clear
      ],
      radial: [
        "rgba(255, 255, 255, 0)", // Center - clear
        "rgba(255, 255, 255, 0.1)",
        "rgba(255, 255, 255, 0.3)",
        "rgba(255, 255, 255, 0.5)",
        "rgba(255, 255, 255, 0.7)",
        "rgba(255, 255, 255, 0.9)",
        "rgba(255, 255, 255, 1)", // Edges - maximum blur
      ],
    };
    return masks[blurDirection] || masks.topToBottom;
  };

  const getGradientDirections = () => {
    const directions = {
      topToBottom: { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } },
      bottomToTop: { start: { x: 0.5, y: 1 }, end: { x: 0.5, y: 0 } },
      leftToRight: { start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } },
      rightToLeft: { start: { x: 1, y: 0.5 }, end: { x: 0, y: 0.5 } },
      diagonal: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
      radial: { start: { x: 0.5, y: 0.5 }, end: { x: 1, y: 1 } },
    };
    return directions[blurDirection] || directions.topToBottom;
  };

  const { colorScheme, layerCount, intensity } = getEnhancedBlurLayers();
  const gradientDirection = getGradientDirections();
  const directionalMask = getDirectionalMask();

  // Create complex gradient arrays for enhanced blur simulation
  const createMainGradient = () => [
    colorScheme.primary,
    colorScheme.secondary,
    colorScheme.tertiary,
    colorScheme.accent,
    colorScheme.tertiary,
    colorScheme.secondary,
    colorScheme.primary,
  ];

  const createSecondaryGradient = () => [
    colorScheme.accent,
    colorScheme.tertiary,
    colorScheme.secondary,
    colorScheme.tertiary,
    colorScheme.accent,
  ];

  const createDepthGradient = () => [
    `rgba(255, 255, 255, ${intensity * 0.02})`,
    `rgba(248, 248, 248, ${intensity * 0.015})`,
    `rgba(240, 240, 240, ${intensity * 0.01})`,
    `rgba(235, 235, 235, ${intensity * 0.005})`,
  ];

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius,
          shadowColor: colorScheme.shadow,
          shadowOffset: {
            width: 0,
            height: intensity > 6 ? 12 : intensity * 2,
          },
          shadowOpacity: blurType === "dark" ? 0.5 : 0.2,
          shadowRadius: intensity * 4,
          elevation: Platform.OS === "android" ? intensity + 4 : 0,
        },
        style,
      ]}
      {...props}
    >
      {/* Base backdrop layer */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: colorScheme.backdrop,
            borderRadius,
            opacity: 0.6,
          },
        ]}
      />

      {/* Multiple blur simulation layers - Creates depth */}
      {Array.from({ length: Math.min(layerCount, 10) }).map((_, index) => {
        const layerOpacity = Math.max(0.015, 0.2 - index * 0.015);
        const scale = 1 - index * 0.008;
        const rotation = (index * 5) % 360;

        return (
          <View
            key={`blur-layer-${index}`}
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor:
                  index % 3 === 0
                    ? colorScheme.primary
                    : index % 3 === 1
                    ? colorScheme.secondary
                    : colorScheme.tertiary,
                borderRadius: borderRadius * scale,
                opacity: layerOpacity,
                transform: [{ scale }, { rotate: `${rotation}deg` }],
                margin: index * 0.5,
              },
            ]}
          />
        );
      })}

      {/* Enhanced base blur background with complex gradients */}
      <LinearGradient
        colors={createMainGradient()}
        style={[StyleSheet.absoluteFillObject, { borderRadius, opacity: 0.8 }]}
        start={gradientDirection.start}
        end={gradientDirection.end}
      />

      {/* Secondary blur layer for depth */}
      <LinearGradient
        colors={createSecondaryGradient()}
        style={[StyleSheet.absoluteFillObject, { borderRadius, opacity: 0.6 }]}
        start={{
          x: 1 - gradientDirection.start.x,
          y: 1 - gradientDirection.start.y,
        }}
        end={{
          x: 1 - gradientDirection.end.x,
          y: 1 - gradientDirection.end.y,
        }}
      />

      {/* Directional Blur Mask - This creates the fading effect */}
      <LinearGradient
        colors={directionalMask}
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius,
            opacity: 0.9,
          },
        ]}
        start={gradientDirection.start}
        end={gradientDirection.end}
      />

      {/* Noise texture layers for realistic blur */}
      {Array.from({ length: 4 }).map((_, index) => (
        <View
          key={`noise-${index}`}
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: colorScheme.noise,
              borderRadius,
              opacity: 0.8 - index * 0.15,
              transform: [
                { rotate: `${index * 30}deg` },
                { scale: 1 - index * 0.01 },
              ],
            },
          ]}
        />
      ))}

      {/* Depth gradient for more realistic blur */}
      <LinearGradient
        colors={createDepthGradient()}
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius,
            opacity: 0.7,
          },
        ]}
        start={{ x: 0.3, y: 0.3 }}
        end={{ x: 0.7, y: 0.7 }}
      />

      {/* Frosted glass effect */}
      {frostedGlass && (
        <>
          {/* Main frosted layer */}
          <LinearGradient
            colors={[
              `rgba(255, 255, 255, 0.15)`,
              `rgba(255, 255, 255, 0.08)`,
              `rgba(255, 255, 255, 0.05)`,
              `rgba(255, 255, 255, 0.12)`,
              `rgba(255, 255, 255, 0.06)`,
            ]}
            style={[
              StyleSheet.absoluteFillObject,
              { borderRadius, opacity: 0.9 },
            ]}
            start={{ x: 0.2, y: 0.2 }}
            end={{ x: 0.8, y: 0.8 }}
          />

          {/* Glass reflection effect */}
          <LinearGradient
            colors={[
              `rgba(255, 255, 255, 0.4)`,
              `rgba(255, 255, 255, 0.1)`,
              "transparent",
              "transparent",
              `rgba(255, 255, 255, 0.05)`,
            ]}
            style={[
              StyleSheet.absoluteFillObject,
              { borderRadius, opacity: 0.5 },
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.6, y: 0.6 }}
          />

          {/* Additional glass shimmer */}
          <LinearGradient
            colors={["transparent", `rgba(255, 255, 255, 0.3)`, "transparent"]}
            style={[
              StyleSheet.absoluteFillObject,
              {
                borderRadius,
                opacity: 0.3,
                transform: [{ rotate: "45deg" }],
              },
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </>
      )}

      {/* Inner glow for depth */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius: borderRadius > 1 ? borderRadius - 1 : borderRadius,
            margin: 0.5,
            shadowColor: colorScheme.glow,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 4,
          },
        ]}
      />

      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius,
            shadowColor:
              blurType === "light" ? colorScheme.glow : colorScheme.border,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 2,
          },
        ]}
      />

      {/* Enhanced content container */}
      <View
        style={[
          styles.contentContainer,
          {
            borderRadius: borderRadius > 2 ? borderRadius - 2 : borderRadius,
            margin: 1,
            backgroundColor: "transparent",
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    position: "relative",
    backgroundColor: "transparent",
  },
  contentContainer: {
    flex: 1,
    zIndex: 100,
    position: "relative",
    backgroundColor: "transparent",
  },
});

export default EnhancedBlurView;
