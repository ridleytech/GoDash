import { Image } from "expo-image";
import { StyleSheet } from "react-native";

import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";

export default function AppHeader() {
  return (
    <ThemedView type="background" style={styles.container}>
      <Image
        source={require("@/assets/images/go-to-logo.jpg")}
        style={styles.logo}
        contentFit="contain"
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    // backgroundColor: "#8d6161",
    // alignItems: "flex-start",
    // justifyContent: "center",
    // paddingHorizontal: Spacing.three,
    paddingLeft: Spacing.two,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  logoPill: {
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  logo: {
    height: 44,
    width: 44,
  },
});
