import React from "react";
import { View } from "react-native";
import type { CompositionType } from "@trs/shared/constants";

const BASE = 26;

/**
 * Minimal geometric glyph for a composition type, drawn with plain views
 * so it needs no asset. `size` scales the 26px drawing.
 */
export function CompositionIcon({
  type,
  color,
  size = BASE,
}: {
  type: CompositionType;
  color: string;
  size?: number;
}) {
  const glyph = <Glyph type={type} color={color} />;
  if (size === BASE) return glyph;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <View style={{ transform: [{ scale: size / BASE }] }}>{glyph}</View>
    </View>
  );
}

function Glyph({ type, color }: { type: CompositionType; color: string }) {
  const box = { width: BASE, height: BASE };
  const line = (style: object) => (
    <View style={[{ position: "absolute", backgroundColor: color }, style]} />
  );

  switch (type) {
    case "SYMMETRY":
      return (
        <View style={box}>
          {line({ left: 12, top: 2, width: 2, height: 22 })}
          {line({ left: 4, top: 6, width: 6, height: 14 })}
          {line({ left: 16, top: 6, width: 6, height: 14 })}
        </View>
      );
    case "ASYMMETRY":
      return (
        <View style={box}>
          {line({ left: 4, top: 4, width: 8, height: 8 })}
          {line({ left: 16, top: 16, width: 6, height: 6 })}
        </View>
      );
    case "FRAME_IN_FRAME":
      return (
        <View
          style={[box, { borderWidth: 2, borderColor: color, alignItems: "center", justifyContent: "center" }]}
        >
          <View style={{ width: 12, height: 12, borderWidth: 2, borderColor: color }} />
        </View>
      );
    case "FIBONACCI":
      return (
        <View style={box}>
          {line({ left: 0, top: 0, width: 26, height: 26, backgroundColor: "transparent", borderWidth: 1.5, borderColor: color })}
          {line({ left: 0, top: 10, width: 16, height: 16, backgroundColor: "transparent", borderWidth: 1.5, borderColor: color })}
          {line({ left: 0, top: 16, width: 10, height: 10, backgroundColor: "transparent", borderWidth: 1.5, borderColor: color })}
        </View>
      );
    case "RULE_OF_THIRDS":
      return (
        <View style={box}>
          {line({ left: 8, top: 0, width: 1.5, height: 26 })}
          {line({ left: 16, top: 0, width: 1.5, height: 26 })}
          {line({ left: 0, top: 8, width: 26, height: 1.5 })}
          {line({ left: 0, top: 16, width: 26, height: 1.5 })}
        </View>
      );
    case "LEADING_LINES":
      return (
        <View style={box}>
          {line({ left: 12, top: 0, width: 2, height: 20, transform: [{ rotate: "20deg" }] })}
          {line({ left: 12, top: 0, width: 2, height: 20, transform: [{ rotate: "-20deg" }] })}
        </View>
      );
    case "DIAGONAL":
      return (
        <View style={box}>
          {line({ left: 12, top: 0, width: 2, height: 26, transform: [{ rotate: "35deg" }] })}
        </View>
      );
    case "CENTERED":
      return (
        <View style={[box, { alignItems: "center", justifyContent: "center" }]}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        </View>
      );
    case "MINIMALIST":
      return (
        <View style={box}>
          {line({ left: 18, top: 18, width: 5, height: 5 })}
        </View>
      );
    case "PATTERN":
      return (
        <View style={[box, { flexDirection: "row", flexWrap: "wrap", gap: 2 }]}>
          {Array.from({ length: 9 }).map((_, i) => (
            <View key={i} style={{ width: 4, height: 4, backgroundColor: color }} />
          ))}
        </View>
      );
    default:
      return <View style={box} />;
  }
}
