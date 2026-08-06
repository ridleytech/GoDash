import * as Linking from "expo-linking";
import React, { useState } from "react";
import { Alert, ScrollView, Share, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DebugOutline } from "@/components/debug/debug-outline";
import HomeCartCard from "@/components/home/home-cart-card";
import HomeGroupSetupCard from "@/components/home/home-group-setup-card";
import HomeMenuCard from "@/components/home/home-menu-card";
import HomeOrderingAsCard from "@/components/home/home-ordering-as-card";
import HomeStartGroupCard from "@/components/home/home-start-group-card";
import AppHeader from "@/components/navigation/app-header";
import { ThemedView } from "@/components/ui/themed-view";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { registerForPushNotificationsAsync } from "@/lib/push-notifications";
import { useGroupOrder } from "@/state/group-order";

export default function HomeScreen() {
  const theme = useTheme();
  const { state, products, actions, selectors } = useGroupOrder();
  const [hostEmailDraft, setHostEmailDraft] = useState("");
  const [inviteDraft, setInviteDraft] = useState("");

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
          <DebugOutline label="app-header.tsx">
            <AppHeader />
          </DebugOutline>

          {!state.hostEmail ? (
            <DebugOutline label="home-start-group-card.tsx">
              <HomeStartGroupCard
                cardStyle={cardStyle}
                theme={theme}
                hostEmailDraft={hostEmailDraft}
                setHostEmailDraft={setHostEmailDraft}
                styles={styles}
                onCreateGroup={async () => {
                  const email = hostEmailDraft.trim().toLowerCase();
                  if (!/^\S+@\S+\.\S+$/.test(email)) {
                    Alert.alert(
                      "Invalid email",
                      "Enter a valid host email address.",
                    );
                    return;
                  }
                  const result = await actions.startGroup(email);
                  if (!result.ok) {
                    Alert.alert("Create group failed", result.reason);
                  }
                }}
              />
            </DebugOutline>
          ) : (
            <>
              <DebugOutline label="home-group-setup-card.tsx">
                <HomeGroupSetupCard
                  cardStyle={cardStyle}
                  theme={theme}
                  hostEmail={state.hostEmail}
                  groupId={state.groupId}
                  invitedEmails={state.invitedEmails}
                  joinedEmails={state.joinedEmails}
                  inviteDraft={inviteDraft}
                  setInviteDraft={setInviteDraft}
                  styles={styles}
                  onSharePushToken={async () => {
                    const result = await registerForPushNotificationsAsync();
                    if (!result.ok) {
                      Alert.alert("Push setup", result.reason);
                      return;
                    }
                    await Share.share({ message: result.token });
                  }}
                  onShareInviteLink={async () => {
                    const url = Linking.createURL("/join", {
                      queryParams: { groupId: state.groupId },
                    });
                    await Share.share({ message: url });
                  }}
                  onInvite={async () => {
                    const result = await actions.addInvite(inviteDraft);
                    if (result.ok) setInviteDraft("");
                    else Alert.alert("Invite failed", result.reason);
                  }}
                  onRemoveInvite={(email) => actions.removeInvite(email)}
                />
              </DebugOutline>

              <DebugOutline label="home-ordering-as-card.tsx">
                <HomeOrderingAsCard
                  cardStyle={cardStyle}
                  participants={participants}
                  activeUserEmail={state.activeUserEmail}
                  hostEmail={state.hostEmail}
                  joinedEmails={state.joinedEmails}
                  onSetActiveUserEmail={(email) =>
                    actions.setActiveUserEmail(email)
                  }
                  styles={styles}
                />
              </DebugOutline>

              <DebugOutline label="home-menu-card.tsx">
                <HomeMenuCard
                  cardStyle={cardStyle}
                  products={products}
                  activeCart={activeCart}
                  onDecrement={(productId) =>
                    actions.decrementFromCart(productId)
                  }
                  onIncrement={(productId) => actions.addToCart(productId)}
                  styles={styles}
                />
              </DebugOutline>

              <DebugOutline label="home-cart-card.tsx">
                <HomeCartCard
                  cardStyle={cardStyle}
                  subtotalCents={selectors.getSubtotalCentsForEmail(
                    state.activeUserEmail,
                  )}
                  activeCart={activeCart}
                  getProductName={getProductName}
                  getProductPrice={getProductPrice}
                  getProductImageUrl={getProductImageUrl}
                  onRemoveFromCart={(productId) =>
                    actions.removeFromCart(productId)
                  }
                  styles={styles}
                />
              </DebugOutline>
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
