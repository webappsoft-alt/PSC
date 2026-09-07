import { useState } from "react";
import {
  Image,
  LayoutChangeEvent,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomText from "../../../../components/CustomText";
import { COLORS } from "../../../../utils/COLORS";

const VotingComponent = () => {
  const [options, setOptions] = useState([
    { id: 1, name: `"Jensen" Huang`, name1: "+1.4k", percentage: 64 },
    { id: 2, name: "Sam Altman", name1: "+0.3k", percentage: 26 },
    { id: 3, name: "Mark Zuckerberg", name1: "+0.3k", percentage: 8 },
  ]);

  const [containerWidth, setContainerWidth] = useState(0);

  const handleVote = (id) => {
    setOptions((prev) => {
      const updated = prev.map((opt) =>
        opt.id === id ? { ...opt, percentage: opt.percentage + 5 } : opt,
      );
      const total = updated.reduce((sum, o) => sum + o.percentage, 0);
      return updated.map((o) => ({
        ...o,
        percentage: Math.round((o.percentage / total) * 100),
      }));
    });
  };

  return (
    <View style={{ gap: 10 }}>
      {options.map((item, index) => {
        const width = (containerWidth * item.percentage) / 100;

        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.8}
            onPress={() => handleVote(item.id)}
          >
            <View
              style={styles.outerBar}
              onLayout={(e: LayoutChangeEvent) =>
                setContainerWidth(e.nativeEvent.layout.width)
              }
            >
              {/* Filled bar */}
              <View
                style={[
                  styles.innerBar,
                  {
                    width: `${item.percentage}%`,
                    backgroundColor:
                      index == 0
                        ? COLORS.white
                        : index == 1
                        ? "#FFFFFF29"
                        : "#FFFFFF0A",
                  },
                ]}
              />

              {/* Text Row */}
              <View style={styles.textRow}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                >
                  <CustomText
                    label={item.name}
                    fontFamily={fonts.medium}
                    color={index == 0 ? COLORS.black : COLORS.white}
                  />
                  <View style={styles.imageStackContainer}>
                    {Array.from({
                      length: index === 0 ? 3 : index === 1 ? 2 : 1,
                    }).map((_, imgIndex) => (
                      <Image
                        key={imgIndex}
                        source={Images.webFlow}
                        style={[
                          styles.stackImage,
                          imgIndex !== 0 && { marginLeft: -6 }, // overlap each next image
                        ]}
                      />
                    ))}
                  </View>
                  <CustomText
                    label={item.name1}
                    fontFamily={fonts.medium}
                    fontSize={12}
                    color={
                      index == 0 ? COLORS.black : "rgba(255, 255, 255, 0.64)"
                    }
                  />
                </View>
                <CustomText
                  label={`${item.percentage}%`}
                  fontFamily={fonts.medium}
                  //   color={width > 100 ? COLORS.black : COLORS.white}
                  color={COLORS.white}
                />
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default VotingComponent;

const styles = StyleSheet.create({
  outerBar: {
    height: 56,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFFFFF0A",
    justifyContent: "center",
  },
  innerBar: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  textRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  imageStackContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  stackImage: {
    height: 18,
    width: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#0000001A", // subtle border for clarity
  },
});
