import React from "react";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";

type Props = {
  cardStyle: any;
  participants: string[];
  activeUserEmail: string;
  hostEmail: string;
  joinedEmails: string[];
  onSetActiveUserEmail: (email: string) => void;
  styles: any;
};

export default function HomeOrderingAsCard({
  cardStyle,
  participants,
  activeUserEmail,
  hostEmail,
  joinedEmails,
  onSetActiveUserEmail,
  styles,
}: Props) {
  return (
    <ThemedView style={cardStyle}>
      <ThemedText type="smallBold">Ordering as</ThemedText>
      <View style={styles.userSwitcher}>
        {participants.map((email) => {
          const isActive = email === activeUserEmail;
          return (
            <Pressable
              key={email}
              onPress={() => onSetActiveUserEmail(email)}
              style={({ pressed }) => [
                styles.userChip,
                isActive && styles.userChipActive,
                pressed && styles.pressed,
              ]}
            >
              <ThemedText
                type="smallBold"
                themeColor={isActive ? "text" : "textSecondary"}
              >
                {email === hostEmail ? "Host" : email.split("@")[0]}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <ThemedText themeColor="textSecondary" type="small">
        Status: {joinedEmails.includes(activeUserEmail) ? "Joined" : "Invited"}
      </ThemedText>
    </ThemedView>
  );
}
