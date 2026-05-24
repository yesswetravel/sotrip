import { useState, useEffect } from "react";
import { StyleSheet, View, TextInput, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "../design-system";
import { useColors } from "../theme/ThemeProvider";
import { spacing } from "../../theme/spacing";

interface Props {
  value: string;
  onChange: (time: string) => void;
  onClear: () => void;
  placeholder?: string;
}

/** Convert 24h "14:30" → { display: "2:30", period: "PM" } */
function to12h(time24: string): { display: string; period: "AM" | "PM" } {
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return { display: `${h}:${mStr}`, period };
}

/** Convert "2:30" + "PM" → "14:30" (24h for storage) */
function to24h(display: string, period: "AM" | "PM"): string {
  const match = display.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return "";
  let h = parseInt(match[1], 10);
  const m = match[2];
  if (period === "AM" && h === 12) h = 0;
  else if (period === "PM" && h !== 12) h += 12;
  return `${String(h).padStart(2, "0")}:${m}`;
}

export default function TimePicker({
  value,
  onChange,
  onClear,
  placeholder = "e.g. 2:30",
}: Props) {
  const colors = useColors();
  const initial = value ? to12h(value) : { display: "", period: "AM" as const };
  const [display, setDisplay] = useState(initial.display);
  const [period, setPeriod] = useState<"AM" | "PM">(initial.period);

  useEffect(() => {
    if (value) {
      const parsed = to12h(value);
      setDisplay(parsed.display);
      setPeriod(parsed.period);
    } else {
      setDisplay("");
    }
  }, [value]);

  function handleBlur() {
    if (!display.trim()) {
      onClear();
      return;
    }
    // Auto-format: "230" → "2:30", "12" → "12:00"
    let cleaned = display.trim();
    if (!cleaned.includes(":")) {
      if (cleaned.length <= 2) {
        cleaned = `${cleaned}:00`;
      } else {
        cleaned = `${cleaned.slice(0, -2)}:${cleaned.slice(-2)}`;
      }
    }
    const result = to24h(cleaned, period);
    if (result) {
      setDisplay(to12h(result).display);
      onChange(result);
    }
  }

  function togglePeriod() {
    const next = period === "AM" ? "PM" : "AM";
    setPeriod(next);
    if (display.trim()) {
      const result = to24h(display.trim(), next);
      if (result) onChange(result);
    }
  }

  return (
    <View style={[styles.row, { backgroundColor: colors.pearl, borderColor: colors.sand }]}>
      <Feather name="clock" size={16} color={colors.stone} style={styles.icon} />
      <TextInput
        style={[styles.input, { color: colors.ink }]}
        placeholder={placeholder}
        placeholderTextColor={colors.stone}
        value={display}
        onChangeText={setDisplay}
        onBlur={handleBlur}
        keyboardType="numbers-and-punctuation"
        returnKeyType="done"
      />
      <TouchableOpacity style={[styles.periodBtn, { backgroundColor: colors.ink }]} onPress={togglePeriod} activeOpacity={0.7}>
        <Text variant="caption" style={[styles.periodText, { color: colors.ivory }]}>{period}</Text>
      </TouchableOpacity>
      {display.length > 0 && (
        <TouchableOpacity
          onPress={() => { setDisplay(""); onClear(); }}
          style={styles.clearBtn}
        >
          <Feather name="x" size={14} color={colors.stone} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontFamily: "InstrumentSans_400Regular",
    fontSize: 15,
  },
  periodBtn: {
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  periodText: {
    fontSize: 12,
    fontFamily: "InstrumentSans_500Medium",
    letterSpacing: 0.5,
  },
  clearBtn: {
    marginLeft: 8,
    padding: 4,
  },
});
