import React from "react";
import { Pressable, TextInput } from "react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import type { Colors } from "@/constants/theme";

type Props = {
  cardStyle: any;
  theme: (typeof Colors)["light"];
  hostEmailDraft: string;
  setHostEmailDraft: (value: string) => void;
  onCreateGroup: () => Promise<void>;
  styles: any;
};

export default function HomeStartGroupCard({
  cardStyle,
  theme,
  hostEmailDraft,
  setHostEmailDraft,
  onCreateGroup,
  styles,
}: Props) {
  return (
    <ThemedView style={cardStyle}>
      <ThemedText type="smallBold">Start a group</ThemedText>
      <TextInput
        testID="host-email-input"
        value={hostEmailDraft}
        onChangeText={setHostEmailDraft}
        placeholder="host@email.com"
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
      <Pressable
        testID="create-group-button"
        onPress={onCreateGroup}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.pressed,
        ]}
      >
        <ThemedText type="smallBold" style={styles.primaryButtonText}>
          Create group
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}
