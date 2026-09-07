import { StyleSheet, View } from "react-native";
import fonts from "../../../../assets/fonts";
import CustomText from "../../../../components/CustomText";

const ConditionCard = () => {
  const conditions = [
    {
      id: 1,
      text: `Loan Amount: The Lender agrees to loan the Borrower the sum of $[AMOUNT] (the "Loan").`,
    },
    {
      id: 2,
      text: "Interest Rate: The Loan shall bear interest at a rate of [PERCENTAGE]% per annum.",
    },
    {
      id: 3,
      text: `Term: The term of this Loan shall be for a period of [NUMBER] years, commencing on the date of this Agreement and ending on [END DATE] (the "Maturity Date").`,
    },
    {
      id: 4,
      text: "Repayment: The entire principal amount of the Loan, together with all accrued and unpaid interest, shall be due and payable in full on the Maturity Date.",
    },
    {
      id: 5,
      text: "Prepayment: The Borrower may prepay the Loan in whole or in part at any time without penalty.",
    },
    {
      id: 6,
      text: "Default: If the Borrower fails to make any payment when due under this Agreement, the entire unpaid principal balance, together with accrued interest, shall become immediately due and payable at the option of the Lender.",
    },
    {
      id: 7,
      text: "Governing Law: This Agreement shall be governed by and construed in accordance with the laws of the State of [STATE], without regard to its conflict of law provisions.",
    },
    {
      id: 8,
      text: "Entire Agreement: This Agreement constitutes the entire agreement between the parties and supersedes all prior agreements and understandings, whether written or oral, relating to the subject matter of this Agreement.",
    },
  ];

  return (
    <View style={styles.container}>
      <CustomText
        label="Conditions"
        fontFamily={fonts.semiBold}
        fontSize={24}
        style={styles.heading}
        marginBottom={16}
      />

      {conditions.map((item, index) => (
        <View key={item.id} style={styles.row}>
          <View style={styles.countContainer}>
            <CustomText
              label={index + 1}
              fontFamily={fonts.medium}
              fontSize={14}
              color="rgba(255, 255, 255, 0.64)"
            />
          </View>

          <CustomText
            label={item.text}
            fontFamily={fonts.regular}
            fontSize={14}
            color="rgba(255, 255, 255, 0.48)"
            style={styles.conditionText}
          />
        </View>
      ))}
    </View>
  );
};

export default ConditionCard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heading: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    marginBottom: 20,
    width: "90%",
  },
  countContainer: {
    height: 32,
    width: 32,
    borderRadius: 99,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  conditionText: {
    flex: 1,
  },
});
