import { StyleSheet, View, TouchableOpacity, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "../design-system";
import { CATEGORIES, type ItemCategory } from "../../theme/categories";
import { useColors } from "../theme/ThemeProvider";
import { spacing } from "../../theme/spacing";

interface Props {
  value: string | null;
  onChange: (category: string) => void;
}

export default function CategoryPicker({ value, onChange }: Props) {
  const colors = useColors();
  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {CATEGORIES.map((cat) => {
          const selected = value === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.chip,
                { backgroundColor: colors.pearl, borderColor: colors.mist },
                selected && { backgroundColor: cat.color },
              ]}
              onPress={() => onChange(cat.key)}
              activeOpacity={0.7}
            >
              <Feather
                name={cat.icon}
                size={14}
                color={selected ? "#fff" : cat.color}
              />
              <Text
                variant="caption"
                style={[
                  styles.chipText,
                  { color: colors.ink },
                  selected && styles.chipTextSelected,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    paddingRight: spacing.md,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    fontSize: 12,
  },
  chipTextSelected: {
    color: "#fff",
  },
});
