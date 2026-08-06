import { Image } from "expo-image";
import React from "react";
import { Pressable, View } from "react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { formatMoney, type Product } from "@/state/group-order";

type Props = {
  cardStyle: any;
  products: Product[];
  activeCart: Record<string, number>;
  onDecrement: (productId: string) => void;
  onIncrement: (productId: string) => void;
  styles: any;
};

export default function HomeMenuCard({
  cardStyle,
  products,
  activeCart,
  onDecrement,
  onIncrement,
  styles,
}: Props) {
  return (
    <ThemedView style={cardStyle}>
      <ThemedText type="smallBold">Menu</ThemedText>
      <View style={styles.menuList}>
        {products.map((p) => {
          const qty = activeCart[p.id] ?? 0;
          return (
            <View key={p.id} style={styles.menuRow}>
              <View style={styles.menuLeft}>
                <Image
                  source={p.imageUrl ? { uri: p.imageUrl } : undefined}
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
                  onPress={() => onDecrement(p.id)}
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
                  onPress={() => onIncrement(p.id)}
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
  );
}
