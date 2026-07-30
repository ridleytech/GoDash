import { Image } from "expo-image";
import { StyleSheet } from "react-native";

import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";

export default function AppHeader() {
  return (
    <ThemedView type="background" style={styles.container}>
      <ThemedView style={styles.logoPill}>
        <Image
          source={require("@/assets/images/go-to-logo.jpg")}
          style={styles.logo}
          contentFit="contain"
        />
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#c92138",
    alignItems: "center",
    justifyContent: "center",
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
    width: 160,
  },
});
