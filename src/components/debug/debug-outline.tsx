import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  label: string;
  children: React.ReactNode;
  enabled?: boolean;
};

function isEnabled(explicit?: boolean) {
  if (explicit !== undefined) return explicit;
  return (
    __DEV__ &&
    (process.env.EXPO_PUBLIC_DEBUG_OUTLINES === "1" ||
      process.env.EXPO_PUBLIC_DEBUG_OUTLINES === "true")
  );
}

export function DebugOutline({ label, children, enabled }: Props) {
  if (!isEnabled(enabled)) return <>{children}</>;

  return (
    <View style={styles.container}>
      {children}
      <View pointerEvents="none" style={styles.border} />
      <View pointerEvents="none" style={styles.labelPill}>
        <Text style={styles.labelText}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: "#FFD400",
    borderRadius: 12,
  },
  labelPill: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#FFD400",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  labelText: {
    color: "#000000",
    fontSize: 11,
    fontWeight: "700",
  },
});
