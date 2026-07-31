import { Image } from "expo-image";
import * as Linking from "expo-linking";
import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "@/components/app-header";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { formatMoney, useGroupOrder } from "@/state/group-order";

export default function HomeScreen() {
  const theme = useTheme();
  const { state, products, actions, selectors } = useGroupOrder();
  const [hostEmailDraft, setHostEmailDraft] = React.useState("");
  const [inviteDraft, setInviteDraft] = React.useState("");

  const participants = selectors.participants;

  const activeCart = selectors.cartForActiveUser;

  function getProductName(productId: string) {
    return products.find((p) => p.id === productId)?.name ?? productId;
  }

  function getProductPrice(productId: string) {
    return products.find((p) => p.id === productId)?.priceCents ?? 0;
  }

  function getProductImageUrl(productId: string) {
    return products.find((p) => p.id === productId)?.imageUrl;
  }

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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          stickyHeaderIndices={[0]}
        >
          <AppHeader />

          {!state.hostEmail ? (
            <ThemedView style={cardStyle}>
              <ThemedText type="smallBold">Start a group</ThemedText>
              <TextInput
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
                onPress={() => {
                  const email = hostEmailDraft.trim().toLowerCase();
                  if (!/^\S+@\S+\.\S+$/.test(email)) {
                    Alert.alert(
                      "Invalid email",
                      "Enter a valid host email address.",
                    );
                    return;
                  }
                  actions.startGroup(email);
                }}
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
          ) : (
            <>
              <ThemedView style={cardStyle}>
                <View style={styles.rowBetween}>
                  <View style={styles.column}>
                    <ThemedText type="smallBold">Host</ThemedText>
                    <ThemedText themeColor="textSecondary" type="small">
                      {state.hostEmail}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.rowBetween}>
                  <ThemedText type="smallBold">Invite link</ThemedText>
                  <Pressable
                    onPress={async () => {
                      const url = Linking.createURL("/join", {
                        queryParams: { groupId: state.groupId },
                      });
                      await Share.share({ message: url });
                    }}
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
                    disabled={state.invitedEmails.length >= 2}
                    onPress={async () => {
                      const result = await actions.addInvite(inviteDraft);
                      if (result.ok) setInviteDraft("");
                      else Alert.alert("Invite failed", result.reason);
                    }}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      styles.primaryButtonRow,
                      state.invitedEmails.length >= 2 && styles.disabled,
                      pressed && styles.pressed,
                    ]}
                  >
                    <ThemedText
                      type="smallBold"
                      style={styles.primaryButtonText}
                    >
                      Invite
                    </ThemedText>
                  </Pressable>
                </View>

                <View style={styles.inviteList}>
                  {state.invitedEmails.length === 0 ? (
                    <ThemedText themeColor="textSecondary" type="small">
                      No invites yet.
                    </ThemedText>
                  ) : (
                    state.invitedEmails.map((email) => (
                      <View key={email} style={styles.rowBetween}>
                        <View style={styles.column}>
                          <ThemedText type="small">{email}</ThemedText>
                          <ThemedText themeColor="textSecondary" type="small">
                            {state.joinedEmails.includes(email)
                              ? "Joined"
                              : "Invited"}
                          </ThemedText>
                        </View>
                        <Pressable
                          onPress={() => actions.removeInvite(email)}
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

              <ThemedView style={cardStyle}>
                <ThemedText type="smallBold">Ordering as</ThemedText>
                <View style={styles.userSwitcher}>
                  {participants.map((email) => {
                    const isActive = email === state.activeUserEmail;
                    return (
                      <Pressable
                        key={email}
                        onPress={() => actions.setActiveUserEmail(email)}
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
                          {email === state.hostEmail
                            ? "Host"
                            : email.split("@")[0]}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>

                <ThemedText themeColor="textSecondary" type="small">
                  Status:{" "}
                  {state.joinedEmails.includes(state.activeUserEmail)
                    ? "Joined"
                    : "Invited"}
                </ThemedText>
              </ThemedView>

              <ThemedView style={cardStyle}>
                <ThemedText type="smallBold">Menu</ThemedText>
                <View style={styles.menuList}>
                  {products.map((p) => {
                    const qty = activeCart[p.id] ?? 0;
                    return (
                      <View key={p.id} style={styles.menuRow}>
                        <View style={styles.menuLeft}>
                          <Image
                            source={
                              p.imageUrl ? { uri: p.imageUrl } : undefined
                            }
                            style={styles.thumb}
                            contentFit="cover"
                          />
                          <View style={styles.column}>
                            <ThemedText type="smallBold">{p.name}</ThemedText>
                            <ThemedText type="small" themeColor="textSecondary">
                              {formatMoney(p.priceCents)}
                            </ThemedText>
                          </View>
                        </View>

                        <View style={styles.qtyControls}>
                          <Pressable
                            onPress={() => actions.decrementFromCart(p.id)}
                            style={({ pressed }) => [
                              styles.qtyButton,
                              pressed && styles.pressed,
                            ]}
                          >
                            <ThemedText type="smallBold">-</ThemedText>
                          </Pressable>
                          <ThemedText type="smallBold" style={styles.qtyText}>
                            {qty}
                          </ThemedText>
                          <Pressable
                            onPress={() => actions.addToCart(p.id)}
                            style={({ pressed }) => [
                              styles.qtyButton,
                              pressed && styles.pressed,
                            ]}
                          >
                            <ThemedText type="smallBold">+</ThemedText>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ThemedView>

              <ThemedView style={cardStyle}>
                <View style={styles.rowBetween}>
                  <ThemedText type="smallBold">Your cart</ThemedText>
                  <ThemedText type="smallBold">
                    {formatMoney(
                      selectors.getSubtotalCentsForEmail(state.activeUserEmail),
                    )}
                  </ThemedText>
                </View>

                {Object.keys(activeCart).length === 0 ? (
                  <ThemedText themeColor="textSecondary" type="small">
                    Cart is empty.
                  </ThemedText>
                ) : (
                  <View style={styles.cartList}>
                    {Object.entries(activeCart).map(([productId, qty]) => (
                      <View key={productId} style={styles.rowBetween}>
                        <View style={styles.menuLeft}>
                          <Image
                            source={
                              getProductImageUrl(productId)
                                ? { uri: getProductImageUrl(productId) }
                                : undefined
                            }
                            style={styles.thumbSmall}
                            contentFit="cover"
                          />
                          <View style={styles.column}>
                            <ThemedText type="smallBold">
                              {getProductName(productId)}
                            </ThemedText>
                            <ThemedText themeColor="textSecondary" type="small">
                              {qty} x {formatMoney(getProductPrice(productId))}
                            </ThemedText>
                          </View>
                        </View>
                        <Pressable
                          onPress={() => actions.removeFromCart(productId)}
                          style={({ pressed }) => [
                            styles.secondaryButton,
                            pressed && styles.pressed,
                          ]}
                        >
                          <ThemedText type="smallBold">Remove</ThemedText>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </ThemedView>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  scrollContent: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.one,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
    borderWidth: 1,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  sectionTitle: {
    marginTop: Spacing.two,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  rowButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  column: {
    flexDirection: "column",
    gap: Spacing.half,
  },
  input: {
    borderWidth: 1,
    borderColor: "#00000020",
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  inputRow: {
    flex: 1,
  },
  inviteList: {
    gap: Spacing.two,
  },
  inviteLinkText: {
    flex: 1,
    flexShrink: 1,
    marginRight: Spacing.two,
  },
  primaryButton: {
    backgroundColor: "#c92138",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonRow: {
    height: 42,
  },
  primaryButtonText: {
    color: "#ffffff",
  },
  secondaryButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: "#00000020",
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
  userSwitcher: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  userChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.five,
    borderWidth: 1,
    borderColor: "#00000020",
  },
  userChipActive: {
    backgroundColor: "#c9213810",
    borderColor: "#c9213840",
  },
  menuList: {
    gap: Spacing.two,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    flexShrink: 1,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#00000010",
  },
  thumbSmall: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#00000010",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: "#00000010",
  },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#c9213820",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#c9213810",
  },
  qtyText: {
    width: 22,
    textAlign: "center",
  },
  cartList: {
    gap: Spacing.two,
  },
});
