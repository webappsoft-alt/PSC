import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

import CustomSwitch from "../../../components/CustomSwitch";
import CustomText from "../../../components/CustomText";
import Icons from "../../../components/Icons";
import ImageFast from "../../../components/ImageFast";
import AnimatedDashedBorder from "../../../components/Auth/AnimatedDashedBorder";
import {
  PscLockup,
  belowBase,
  capTop,
  ls,
  textGap,
  useAuthPalette,
} from "../../../components/Auth/AuthKit";
import fonts from "../../../assets/fonts";
import {
  addSavedAccount,
  setSkipProfileSelector,
} from "../../../store/reducer/usersSlice";
import { accountId, buildSavedAccount } from "../../../utils/accountSession";
import { hasProfilePin } from "../../../utils/profileLock";

const GAP = 8;
const CARD_RADIUS = 48;

/** Profile card: 171.5², FFFFFF 4%, radius 48, avatar 72 in a 2px 16% ring. */
const AccountCard = ({ account, size, onPress }) => {
  const p = useAuthPalette();
  const avatar = account?.profilePic || account?.avatar;
  const name = account?.name || account?.username || "Account";
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.card,
        { width: size, height: size, backgroundColor: p.t04 },
      ]}
    >
      <View style={[styles.avatar, { borderColor: p.t16 }]}>
        {avatar ? (
          <ImageFast
            source={{ uri: avatar }}
            style={styles.avatarImg}
            resizeMode="cover"
          />
        ) : (
          <CustomText
            label={name.charAt(0).toUpperCase()}
            fontSize={28}
            fontFamily={fonts.semiBold}
            color={p.text}
          />
        )}
      </View>
      <View style={[styles.nameRow, { marginTop: 16 - capTop(12) }]}>
        <CustomText
          label={name}
          fontSize={12}
          fontFamily={fonts.medium}
          letterSpacing={ls(-3, 12)}
          color={p.text}
          numberOfLines={1}
        />
        {account?.isPro || account?.isVerified ? (
          <Icons
            family="MaterialSymbolsRoundedFilled"
            name="verified"
            size={12}
            color={p.blue}
          />
        ) : null}
      </View>
      <CustomText
        label={account?.isPro ? "Pro User" : "Regular User"}
        fontSize={12}
        fontFamily={fonts.medium}
        letterSpacing={ls(-2, 12)}
        color={p.t64}
        marginTop={textGap(10, 12, 12)}
      />
    </TouchableOpacity>
  );
};

/** Figma "Profile-Selector" (7454:5305), ported from Viral. */
const ProfileSelector = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const p = useAuthPalette();

  const users = useSelector((s) => s?.users);
  const token = useSelector((s) => s?.authConfig?.token);
  const accounts = Array.isArray(users?.savedAccounts)
    ? users.savedAccounts
    : [];
  const skip = !!users?.skipProfileSelector;
  const [opening, setOpening] = useState("");

  const size = (Math.min(width, 600) - 24 - GAP) / 2;

  // Sessions from before the selector existed: list the signed-in account too.
  useEffect(() => {
    const user = users?.userData;
    const id = accountId(user);
    if (!token || !id) return;
    if (accounts.some((a) => String(a?.id) === id)) return;
    (async () => {
      const refreshToken = (await AsyncStorage.getItem("refreshToken")) || "";
      const saved = buildSavedAccount(user, {
        accessToken: token,
        refreshToken,
      });
      if (saved) dispatch(addSavedAccount(saved));
    })();
  }, []);

  const open = (account) => {
    if (opening) return;
    const id = String(account?.id || "");
    if (!id) return;
    setOpening(id);
    navigation.navigate("PinVerification", {
      mode: hasProfilePin(users, id) ? "enter" : "define",
      purpose: "profile",
      accountId: id,
    });
    setTimeout(() => setOpening(""), 600);
  };

  const strong = { color: p.t48 };

  return (
    <View style={[styles.screen, { backgroundColor: p.deep }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + (63 - 44),
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <PscLockup />
        <CustomText
          label="Welcome Back!"
          fontSize={32}
          fontFamily={fonts.semiBold}
          letterSpacing={ls(-2, 32)}
          textAlign="center"
          color={p.text}
          marginTop={32 - capTop(32)}
        />
        <CustomText
          label="Pick the account you want to pursue with"
          fontSize={14}
          letterSpacing={ls(-2, 14)}
          textAlign="center"
          color={p.t64}
          marginTop={textGap(20, 32, 14)}
          marginBottom={32 - belowBase(14)}
        />

        <View style={styles.grid}>
          {accounts.map((a) => (
            <AccountCard
              key={String(a?.id || a?.email)}
              account={a}
              size={size}
              onPress={() => open(a)}
            />
          ))}
          <TouchableOpacity
            activeOpacity={0.8}
            // Get-started screen (Register + Login), not straight to Login.
            onPress={() =>
              navigation.navigate("AuthStack", { screen: "OnBoardingScreens" })
            }
            style={[styles.card, { width: size, height: size }]}
          >
            <AnimatedDashedBorder
              color={p.t08}
              borderRadius={CARD_RADIUS}
              dashLength={8}
              gapLength={8}
            />
            <Icons
              family="MaterialSymbolsRounded"
              name="add"
              size={72}
              color={p.t48}
            />
            <CustomText
              label="Add Account"
              fontSize={14}
              fontFamily={fonts.medium}
              letterSpacing={ls(-3, 14)}
              color={p.t48}
              marginTop={16 - capTop(14)}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.bottom}>
          <View style={[styles.skipRow, { backgroundColor: p.t04 }]}>
            <CustomText
              label="Don’t show next time"
              fontSize={16}
              fontFamily={fonts.medium}
              letterSpacing={ls(-3, 16)}
              color={p.t64}
            />
            <CustomSwitch
              value={skip}
              setValue={(v) => dispatch(setSkipProfileSelector(v))}
            />
          </View>

          <CustomText
            fontSize={10}
            fontFamily={fonts.medium}
            letterSpacing={ls(-2, 10)}
            textAlign="center"
            color={p.t16}
            marginTop={32 - capTop(10)}
          >
            © {new Date().getFullYear()} <Text style={strong}>Sola Group</Text>.
            All rights reserved. <Text style={strong}>Sola Group</Text>,{" "}
            <Text style={strong}>SG</Text>, the{" "}
            <Text style={strong}>Sola Group</Text> logo,{" "}
            <Text style={strong}>Private Social Club</Text>,{" "}
            <Text style={strong}>Private Social Club</Text> (stylized),{" "}
            <Text style={strong}>PSC</Text>, <Text style={strong}>PSC</Text>{" "}
            logo are trademarks or registered of{" "}
            <Text style={strong}>Sola Group</Text> in the USA and elsewhere. All
            other trademarks are the property of their respective owners.
          </CustomText>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileSelector;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  card: {
    borderRadius: CARD_RADIUS,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 100,
    borderWidth: 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: {
    ...StyleSheet.absoluteFillObject,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    maxWidth: "100%",
  },
  bottom: {
    marginTop: "auto",
    paddingTop: 32,
  },
  skipRow: {
    height: 48,
    borderRadius: 12,
    paddingLeft: 12,
    paddingRight: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
