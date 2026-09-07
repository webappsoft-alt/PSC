import {
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import fonts from "../../../../assets/fonts";
import { Images } from "../../../../assets/images";
import CustomButton from "../../../../components/CustomButton";
import CustomModal from "../../../../components/CustomModal";
import CustomText from "../../../../components/CustomText";
import Icons from "../../../../components/Icons";
import { COLORS } from "../../../../utils/COLORS";
import { useTheme } from "../../../../contexts/ThemeContext";

const ageRatings = [
  { id: "Kids", title: "Under 10 years old" },
  { id: "+10", title: "10 years old or older" },
  { id: "+12", title: "12 years old or older" },
  { id: "+14", title: "14 years old or older" },
  { id: "+16", title: "16 years old or older" },
  { id: "+18", title: "18 years old or older" },
  { id: "+21", title: "21 years old or older" },
  { id: "+25", title: "25 years old or older" },
];

const audience = [
  { id: "Everyone" },
  { id: "Adults", title: "12+ years old" },
  { id: "Students", title: "Student ID Required" },
  { id: "Children", title: "3–11 years old" },
  { id: "Toddlers", title: "Under 3 years old" },
  { id: "Accessibility" },
  { id: "Seniors", title: "65+ years old" },
  { id: "Groups", title: "For more than 2 persons" },
  { id: "Other" },
];

const categories = [
  { id: "Food" },
  { id: "Beverage" },
  { id: "Merchandise" },
  { id: "Other" },
];

const visibleToOptions = [
  { id: "Public" },
  { id: "Followers" },
  { id: "BFFs" },
  { id: "Private" },
];

const currencyOptions = [
  { id: "USD", title: "US Dollar" },
  { id: "EUR", title: "Euro" },
  { id: "GBP", title: "British Pound" },

  { id: "AED", title: "UAE Dirham" },
  { id: "SAR", title: "Saudi Riyal" },
  { id: "QAR", title: "Qatari Riyal" },
  { id: "KWD", title: "Kuwaiti Dinar" },

  { id: "INR", title: "Indian Rupee" },
  { id: "PKR", title: "Pakistani Rupee" },
  { id: "BDT", title: "Bangladeshi Taka" },
  { id: "LKR", title: "Sri Lankan Rupee" },
  { id: "NPR", title: "Nepalese Rupee" },

  { id: "CAD", title: "Canadian Dollar" },
  { id: "AUD", title: "Australian Dollar" },
  { id: "NZD", title: "New Zealand Dollar" },

  { id: "CNY", title: "Chinese Yuan" },
  { id: "JPY", title: "Japanese Yen" },
  { id: "KRW", title: "South Korean Won" },

  { id: "ZAR", title: "South African Rand" },
  { id: "NGN", title: "Nigerian Naira" },
  { id: "EGP", title: "Egyptian Pound" },

  { id: "BRL", title: "Brazilian Real" },
  { id: "ARS", title: "Argentine Peso" },
  { id: "MXN", title: "Mexican Peso" },

  { id: "TRY", title: "Turkish Lira" },
  { id: "CHF", title: "Swiss Franc" },
  { id: "SEK", title: "Swedish Krona" },
  { id: "NOK", title: "Norwegian Krone" },
  { id: "DKK", title: "Danish Krone" },
];

const unitOptions = [
  { id: "g" },
  { id: "kg" },
  { id: "ml" },
  { id: "mg" },
  { id: "oz" },
  { id: "l" },
];

const SelectionModal = ({
  isVisible,
  onModalClose,
  type = "age",
  selected,
  onSelection = () => "",
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const getOptions = () => {
    switch (type) {
      case "age":
        return ageRatings;
      case "audience":
        return audience;
      case "categories":
        return categories;
      case "visibleTo":
        return visibleToOptions;
      case "currency":
        return currencyOptions;
      case "unit":
        return unitOptions;
      default:
        return [];
    }
  };

  const getTitle = () => {
    switch (type) {
      case "age":
        return "Age Rating";
      case "audience":
        return "Audience Type";
      case "categories":
        return "Categories";
      case "visibleTo":
        return "Visible To";
      case "currency":
        return "Currency";
      case "unit":
        return "Unit";
      default:
        return "Select Option";
    }
  };

  return (
    <CustomModal isChange isVisible={isVisible}>
      <View style={styles.modalConatiner}>
        <View style={[styles.row, { marginTop: insets.top }]}>
          <CustomText
            label={getTitle()}
            fontSize={24}
            fontFamily={fonts.semiBold}
            lineHeight={24 * 1.4}
          />
          <TouchableOpacity
            style={styles.iconContainer}
            activeOpacity={0.8}
            onPress={onModalClose}
          >
            <Image
              source={Images.cross}
              style={{ height: 18, width: 18, tintColor: colors.iconMuted }}
            />
          </TouchableOpacity>
        </View>

        <CustomText
          label={"Please select one"}
          fontSize={14}
          fontFamily={fonts.medium}
          lineHeight={14 * 1.4}
          color={colors.iconMuted}
          marginTop={4}
          marginBottom={8}
        />

        <FlatList
          data={getOptions()}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => onSelection(item.id)}
              activeOpacity={0.9}
              style={[
                styles.row,
                { paddingHorizontal: 12, paddingVertical: 10 },
              ]}
            >
              <View>
                <CustomText
                  label={item?.id}
                  fontSize={16}
                  fontFamily={fonts.medium}
                />
                {item?.title && (
                  <CustomText
                    label={item.title}
                    fontSize={14}
                    color={colors.iconMuted}
                  />
                )}
              </View>

              {selected === item?.id ? (
                <Icons
                  family="MaterialCommunityIcons"
                  name={"radiobox-marked"}
                  size={26}
                  color={colors.buttonColor}
                />
              ) : (
                <Icons
                  family="MaterialCommunityIcons"
                  name={"radiobox-blank"}
                  size={26}
                  color={colors.iconMuted}
                />
              )}
            </TouchableOpacity>
          )}
        />

        <CustomButton
          title={"Confirm"}
          marginBottom={insets.bottom}
          onPress={onModalClose}
        />
      </View>
    </CustomModal>
  );
};

export default SelectionModal;

const createStyles = (colors) => StyleSheet.create({
  modalConatiner: {
    backgroundColor: colors.background,
    borderColor: colors.mode === "dark" ? "rgba(255, 255, 255, 0.16)" : colors.border,
    width: "100%",
    height: "100%",
    padding: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconContainer: {
    borderRadius: 99,
    height: 35,
    width: 35,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cardColor,
  },
});
