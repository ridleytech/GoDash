import React from "react";
import { Pressable, TextInput, View } from "react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import type { Colors } from "@/constants/theme";

type Props = {
  cardStyle: any;
  theme: (typeof Colors)["light"];
  hostEmail: string;
  invitedEmails: string[];
  joinedEmails: string[];
  inviteDraft: string;
  setInviteDraft: (value: string) => void;
  onSharePushToken: () => Promise<void>;
  onShareInviteLink: () => Promise<void>;
  onInvite: () => Promise<void>;
  inviteDisabled?: boolean;
  inviteLabel?: string;
  onRemoveInvite: (email: string) => void;
  styles: any;
};

export default function HomeGroupSetupCard({
  cardStyle,
  theme,
  hostEmail,
  invitedEmails,
  joinedEmails,
  inviteDraft,
  setInviteDraft,
  onSharePushToken,
  onShareInviteLink,
  onInvite,
  inviteDisabled,
  inviteLabel,
  onRemoveInvite,
  styles,
}: Props) {
  return (
    <ThemedView style={cardStyle}>
      <View style={styles.rowBetween}>
        <View style={styles.column}>
          <ThemedText type="smallBold">Host</ThemedText>
          <ThemedText themeColor="textSecondary" type="small">
            {hostEmail}
          </ThemedText>
        </View>
      </View>

      {/* <View style={styles.rowBetween}>
        <ThemedText type="smallBold">Push token</ThemedText>
        <Pressable
          testID="copy-push-token-button"
          onPress={onSharePushToken}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
          ]}
        >
          <ThemedText type="smallBold">Share</ThemedText>
        </Pressable>
      </View> */}

      <View style={styles.rowBetween}>
        <ThemedText type="smallBold">Invite link</ThemedText>
        <Pressable
          testID="share-invite-link-button"
          onPress={onShareInviteLink}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
          ]}
        >
          <ThemedText type="smallBold">Share</ThemedText>
        </Pressable>
      </View>

      <ThemedText type="smallBold" style={styles.sectionTitle}>
        Invite participants (max 3 total)
      </ThemedText>
      <View style={styles.row}>
        <TextInput
          testID="invite-email-input"
          value={inviteDraft}
          onChangeText={setInviteDraft}
          placeholder="friend@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.input,
            styles.inputRow,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.backgroundSelected,
              color: theme.text,
            },
          ]}
        />
        <Pressable
          testID="invite-button"
          disabled={invitedEmails.length >= 2 || inviteDisabled}
          onPress={onInvite}
          style={({ pressed }) => [
            styles.primaryButton,
            styles.primaryButtonRow,
            (invitedEmails.length >= 2 || inviteDisabled) && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <ThemedText type="smallBold" style={styles.primaryButtonText}>
            {inviteLabel ?? "Invite"}
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.inviteList}>
        {invitedEmails.length === 0 ? (
          <ThemedText themeColor="textSecondary" type="small">
            No invites yet.
          </ThemedText>
        ) : (
          invitedEmails.map((email) => (
            <View key={email} style={styles.rowBetween}>
              <View style={styles.column}>
                <ThemedText type="small">{email}</ThemedText>
                <ThemedText themeColor="textSecondary" type="small">
                  {joinedEmails.includes(email) ? "Joined" : "Invited"}
                </ThemedText>
              </View>
              <Pressable
                onPress={() => onRemoveInvite(email)}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.pressed,
                ]}
              >
                <ThemedText type="smallBold">Remove</ThemedText>
              </Pressable>
            </View>
          ))
        )}
      </View>
    </ThemedView>
  );
}
