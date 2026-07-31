import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import AppHeader from "@/components/app-header";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useGroupOrder } from "@/state/group-order";

export default function JoinScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ groupId?: string }>();
  const { actions } = useGroupOrder();

  const [groupIdDraft, setGroupIdDraft] = React.useState(
    typeof params.groupId === "string" ? params.groupId : "",
  );
  const [emailDraft, setEmailDraft] = React.useState("");

  const cardStyle = [
    styles.card,
    {
      backgroundColor: theme.backgroundElement,
      borderColor: theme.backgroundSelected,
      shadowColor: theme.text,
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} stickyHeaderIndices={[0]}>
          <AppHeader />

          <ThemedView style={cardStyle}>
            <ThemedText type="smallBold">Join a group</ThemedText>

            <View style={styles.field}>
              <ThemedText type="smallBold">Group ID</ThemedText>
              <TextInput
                value={groupIdDraft}
                onChangeText={setGroupIdDraft}
                placeholder="paste group id"
                autoCapitalize="none"
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.backgroundSelected,
                    color: theme.text,
                  },
                ]}
              />
            </View>

            <View style={styles.field}>
              <ThemedText type="smallBold">Your email</ThemedText>
              <TextInput
                value={emailDraft}
                onChangeText={setEmailDraft}
                placeholder="you@email.com"
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor={theme.textSecondary}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.backgroundSelected,
                    color: theme.text,
                  },
                ]}
              />
            </View>

            <Pressable
              onPress={async () => {
                const result = await actions.loadGroup(groupIdDraft, emailDraft);
                if (!result.ok) {
                  Alert.alert("Join failed", result.reason);
                  return;
                }
                router.replace("/");
              }}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <ThemedText type="smallBold" style={styles.primaryButtonText}>
                Join
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    maxWidth: MaxContentWidth,
  },
  content: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.three,
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderColor: "#00000020",
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  primaryButton: {
    backgroundColor: "#c92138",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
  },
  pressed: {
    opacity: 0.7,
  },
});
