import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "@/components/app-header";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { WebBadge } from "@/components/web-badge";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { formatMoney, useGroupOrder } from "@/state/group-order";

export default function TabTwoScreen() {
  const theme = useTheme();
  const { state, products, selectors, actions } = useGroupOrder();

  const cardStyle = [
    styles.card,
    {
      backgroundColor: theme.backgroundElement,
      borderColor: theme.backgroundSelected,
      shadowColor: theme.text,
    },
  ];

  const contentPlatformStyle = Platform.select({
    web: {
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={[styles.scrollView, { backgroundColor: theme.background }]}
          contentContainerStyle={[
            styles.contentContainer,
            contentPlatformStyle,
          ]}
          stickyHeaderIndices={[0]}
        >
          <AppHeader />

          {!state.hostEmail ? (
            <ThemedView style={cardStyle}>
              <ThemedText type="smallBold">No active group</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Go to the Group Order tab to create a group and invite people.
              </ThemedText>
            </ThemedView>
          ) : (
            <>
              <ThemedView style={cardStyle}>
                <View style={styles.rowBetween}>
                  <ThemedText type="smallBold">Total</ThemedText>
                  <ThemedText type="smallBold">
                    {formatMoney(selectors.getTotalCents())}
                  </ThemedText>
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  Host: {state.hostEmail}
                </ThemedText>
              </ThemedView>

              {selectors.participants.map((email) => {
                const cart = state.cartsByEmail[email] ?? {};
                const subtotal = selectors.getSubtotalCentsForEmail(email);
                const label = email === state.hostEmail ? "Host" : email;

                return (
                  <ThemedView key={email} style={cardStyle}>
                    <View style={styles.rowBetween}>
                      <ThemedText type="smallBold">{label}</ThemedText>
                      <ThemedText type="smallBold">
                        {formatMoney(subtotal)}
                      </ThemedText>
                    </View>

                    {Object.keys(cart).length === 0 ? (
                      <ThemedText type="small" themeColor="textSecondary">
                        No items.
                      </ThemedText>
                    ) : (
                      <View style={styles.itemsList}>
                        {Object.entries(cart).map(([productId, qty]) => {
                          const product = products.find(
                            (p) => p.id === productId,
                          );
                          if (!product) return null;
                          return (
                            <View key={productId} style={styles.rowBetween}>
                              <ThemedText type="small">
                                {product.name}
                              </ThemedText>
                              <ThemedText
                                type="small"
                                themeColor="textSecondary"
                              >
                                {qty} x {formatMoney(product.priceCents)}
                              </ThemedText>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </ThemedView>
                );
              })}

              <ThemedView style={cardStyle}>
                {
                  selectors.isHostActive ? (
                    <Pressable
                      onPress={() => {
                        const lines = selectors.participants.map((email) => {
                          const who =
                            email === state.hostEmail ? "Host" : email;
                          const subtotal =
                            selectors.getSubtotalCentsForEmail(email);
                          return `${who}: ${formatMoney(subtotal)}`;
                        });

                        actions
                          .checkout()
                          .then(() => {
                            Alert.alert(
                              "Checkout summary",
                              `${lines.join("\n")}\n\nTotal: ${formatMoney(
                                selectors.getTotalCents(),
                              )}`,
                            );
                          })
                          .catch((e) => {
                            Alert.alert(
                              "Checkout failed",
                              e instanceof Error
                                ? e.message
                                : "Checkout failed",
                            );
                          });
                      }}
                      style={({ pressed }) => [
                        styles.primaryButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <ThemedText
                        type="smallBold"
                        style={styles.primaryButtonText}
                      >
                        Checkout
                      </ThemedText>
                    </Pressable>
                  ) : null
                  // <ThemedText type="small" themeColor="textSecondary">
                  //   Only the host can checkout. Switch to the host on the
                  //   Group Order tab.
                  // </ThemedText>
                }
              </ThemedView>
            </>
          )}

          {Platform.OS === "web" && <WebBadge />}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
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
  contentContainer: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  centerText: {
    textAlign: "center",
  },
  pressed: {
    opacity: 0.7,
  },
  sectionsWrapper: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
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
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  itemsList: {
    gap: Spacing.one,
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
});
