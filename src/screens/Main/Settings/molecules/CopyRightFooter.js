import {StyleSheet, View} from "react-native";
import fonts from "../../../../assets/fonts";
import { COLORS } from "../../../../utils/COLORS";
import Text from "../../../../components/ScaledText";

const CopyrightFooter = ({ paddingTop = 32, paddingBottom = 56 }) => {
  const year = new Date().getFullYear();
  return (
    <View style={[styles.container, { paddingTop, paddingBottom }]}>
      <Text
        style={[
          styles.text,
          {
            color: COLORS.white,
          },
        ]}
      >
        ©{year} <Text style={styles.bold}>Sola Group</Text>. All rights
        reserved. <Text style={styles.bold}>Sola Group, SG</Text>, the{" "}
        <Text style={styles.bold}>Sola Group</Text> logo,{" "}
        <Text style={styles.bold}>PSC, PSC</Text> (stylized),{" "}
        <Text style={styles.bold}>V, V</Text> logo are trademarks or registered
        of <Text style={styles.bold}>Sola Group</Text> in the USA and elsewhere.
        {"\n"}
        All other trademarks are the property of their respective owners.
      </Text>
    </View>
  );
};

export default CopyrightFooter;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: COLORS.white,
    fontSize: 10,
    textAlign: "center",
  },
  bold: {
    fontSize: 10,
    fontFamily: fonts.medium,
  },
});
