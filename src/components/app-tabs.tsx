import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useColorScheme } from "react-native";

import { Colors } from "@/constants/theme";

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];
  const primary = "#c92138";

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={primary}
      tintColor={primary}
      labelStyle={{ selected: { color: primary } }}
    >
      <NativeTabs.Trigger
        name="index"
        options={{
          title: "Group Order",
          icon: { src: require("@/assets/images/tabIcons/home.png") },
        }}
      />

      <NativeTabs.Trigger
        name="explore"
        options={{
          title: "Summary",
          icon: { src: require("@/assets/images/tabIcons/explore.png") },
        }}
      />
    </NativeTabs>
  );
}
