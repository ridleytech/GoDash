import { Image } from "expo-image";
import React from "react";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { formatMoney } from "@/state/group-order";

type Props = {
  cardStyle: any;
  subtotalCents: number;
  activeCart: Record<string, number>;
  getProductName: (productId: string) => string;
  getProductPrice: (productId: string) => number;
  getProductImageUrl: (productId: string) => string | undefined;
  onRemoveFromCart: (productId: string) => void;
  styles: any;
};

export default function HomeCartCard({
  cardStyle,
  subtotalCents,
  activeCart,
  getProductName,
  getProductPrice,
  getProductImageUrl,
  onRemoveFromCart,
  styles,
}: Props) {
  return (
    <ThemedView style={cardStyle}>
      <View style={styles.rowBetween}>
        <ThemedText type="smallBold">Your cart</ThemedText>
        <ThemedText type="smallBold">{formatMoney(subtotalCents)}</ThemedText>
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
                onPress={() => onRemoveFromCart(productId)}
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
  );
}
