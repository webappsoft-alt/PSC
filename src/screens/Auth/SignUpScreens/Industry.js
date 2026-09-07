import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { StyleSheet, View } from "react-native";
import CustomDropdown from "../../../components/CustomDropdown";
import CustomText from "../../../components/CustomText";
import ErrorComponent from "../../../components/ErrorComponent";

import fonts from "../../../assets/fonts";
import { Images } from "../../../assets/images";
import FilterModal from "../../../components/CarFilterModal";
import { COLORS } from "../../../utils/COLORS";
import { useTheme } from "../../../contexts/ThemeContext";

const topics = [
  { name: "Technology", image: Images.Topis1 },
  { name: "Politics", image: Images.Topis2 },
  { name: "Sports", image: Images.Topis3 },
  { name: "Music", image: Images.Topis4 },
  { name: "Entertainment", image: Images.Topis5 },
  { name: "Fashion", image: Images.Topis6 },
  { name: "Food", image: Images.Topis7 },
  { name: "Gaming", image: Images.Topis8 },
  { name: "Health", image: Images.Topis9 },
];

const Industry = forwardRef(
  ({ currentIndex, setCurrentIndex, state, setState, setBtnDisabled }, ref) => {
    const { colors, isDark } = useTheme();
    const [industry, setIndustry] = useState(
      Array.isArray(state?.industry)
        ? state.industry
        : state?.industry
        ? [state.industry]
        : [],
    );
    const [filterModal, setFilterModal] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
      setBtnDisabled?.(!industry || industry.length === 0);
    }, [industry]);

    const normalize = (val) => (val || "").toString().trim().toLowerCase();

    const errorCheck = (val) => {
      let newErrors = "";
      if (!val || val.length === 0) {
        newErrors = "Please select your industry";
      } else {
        const invalid = val.filter(
          (item) =>
            !topics.some((topic) => normalize(topic.name) === normalize(item)),
        );
        if (invalid.length > 0) {
          newErrors = "Please choose valid industries from the list";
        }
      }
      return newErrors;
    };

    const submit = async () => {
      const err = errorCheck(industry);
      if (err) {
        setError(err);
        return;
      }
      setError("");
      const valueToStore = industry.map((item) => normalize(item));
      setState({ ...state, industry: valueToStore });

      if (currentIndex < 12) {
        setCurrentIndex(11);
      }
    };

    const back = () => {
      setCurrentIndex(9);
    };

    useImperativeHandle(ref, () => ({ submit, back, isLoading: false }));

    return (
      <View style={styles.container}>
        <View>
          <CustomText
            label="What’s your industry?"
            fontFamily={fonts.semiBold}
            fontSize={24}
            lineHeight={24 * 1.4}
            marginTop={12}
            marginBottom={6}
            color={isDark ? COLORS.white : colors.text}
          />

          <CustomDropdown
            value={industry.join(", ")}
            placeholder="E.g. Technology, Music"
            error={error}
            modalTitle="Select Industry"
            onPress={() => setFilterModal(true)}
          />

          <ErrorComponent
            errorTitle="This will appear on your profile."
            marginBottom={2}
          />

          <FilterModal
            isVisible={filterModal}
            onDisable={() => setFilterModal(false)}
            title="Select A Topic"
            subtitle="Select your filters"
            filters={topics}
            multiSelect={true}
            selectedItems={industry}
            onConfirm={(selected) => {
              setIndustry(selected);
              if (error) {
                setError(errorCheck(selected));
              }
            }}
          />
        </View>
      </View>
    );
  },
);

export default Industry;

const styles = StyleSheet.create({
  container: {
    justifyContent: "space-between",
    flex: 1,
  },
});
