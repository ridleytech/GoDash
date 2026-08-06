import { formatMoney } from "@/state/group-order";
import { Image, Pressable, View } from "react-native";
import { DebugOutline } from "../debug/debug-outline";
import { ThemedText } from "../ui/themed-text";

export const MenuCardItem = ({
  p,
  styles,
  qty,
  onDecrement,
  onIncrement,
}: {
  p: any;
  styles: any;
  qty: number;
  onDecrement: (productId: string) => void;
  onIncrement: (productId: string) => void;
}) => {
  return (
    <DebugOutline label="menu-card-item">
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
    </DebugOutline>
  );
};
