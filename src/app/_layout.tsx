import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { StripeProvider } from "@stripe/stripe-react-native";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";

import AppTabs from "@/components/navigation/app-tabs";
import { AnimatedSplashOverlay } from "@/components/ui/animated-icon";
import { GroupOrderProvider } from "@/state/group-order";

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <StripeProvider publishableKey={publishableKey}>
        <GroupOrderProvider>
          <AnimatedSplashOverlay />
          <AppTabs />
        </GroupOrderProvider>
      </StripeProvider>
    </ThemeProvider>
  );
}
