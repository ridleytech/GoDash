import React from "react";
import { View } from "react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { ThemedView } from "@/components/ui/themed-view";
import { type Product } from "@/state/group-order";
import { MenuCardItem } from "./menu-card-item";

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
            <MenuCardItem
              qty={qty}
              key={p.id}
              p={p}
              styles={styles}
              onDecrement={onDecrement}
              onIncrement={onIncrement}
            />
          );
        })}
      </View>
    </ThemedView>
  );
}
