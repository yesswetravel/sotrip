import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Container, Text } from "../../../features/design-system";
import { goBack } from "../../../lib/go-back";
import { useTrip } from "../../../features/trips/hooks";
import { useColors } from "../../../features/theme/ThemeProvider";
import { spacing } from "../../../theme/spacing";

function FolderItem({
  icon,
  label,
  subtitle,
  color,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  subtitle: string;
  color: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: colors.pearl, borderColor: colors.mist }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.itemIcon, { backgroundColor: color + "14" }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <View style={styles.itemContent}>
        <Text variant="body" style={[styles.itemLabel, { color: colors.ink }]}>{label}</Text>
        <Text variant="caption" style={{ color: colors.stone }}>{subtitle}</Text>
      </View>
      <Feather name="chevron-right" size={16} color={colors.sand} />
    </TouchableOpacity>
  );
}

export default function FolderScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: trip } = useTrip(id);

  return (
    <Container safe={false} logo>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => goBack(router)} activeOpacity={0.7}>
            <Feather name="chevron-left" size={20} color={colors.ink} />
          </TouchableOpacity>
          <Text variant="eyebrow" style={{ color: colors.stone }}>
            {trip?.title ?? "trip"}
          </Text>
          <View style={{ width: 22 }} />
        </View>

        <View style={styles.titleBlock}>
          <Text variant="display" style={[styles.title, { color: colors.ink }]}>folder</Text>
          <Text variant="caption" style={{ color: colors.stone }}>
            everything you need for your trip
          </Text>
        </View>

        {/* Folder items */}
        <View style={styles.list}>
          <FolderItem
            icon="check-square"
            label="packing list"
            subtitle="what to bring"
            color={colors.teal}
            onPress={() => router.push(`/trip/${id}/packing`)}
          />
          <FolderItem
            icon="file-text"
            label="documents"
            subtitle="visa, passport, bookings"
            color={colors.gold}
            onPress={() => router.push(`/trip/${id}/documents`)}
          />
          <FolderItem
            icon="dollar-sign"
            label="budget"
            subtitle="spending & estimates"
            color={colors.coral}
            onPress={() => router.push(`/trip/${id}/budget`)}
          />
          <FolderItem
            icon="edit-3"
            label="notes"
            subtitle="trip notes & ideas"
            color={colors.stone}
            onPress={() => router.push(`/trip/${id}/notes`)}
          />
          <FolderItem
            icon="book"
            label="memory book"
            subtitle="create a keepsake from your trip"
            color={colors.coral}
            onPress={() => router.push(`/trip/${id}/memory`)}
          />
          <FolderItem
            icon="share"
            label="share trip"
            subtitle="send your itinerary to anyone"
            color={colors.coral}
            onPress={() => router.push(`/trip/${id}/share`)}
          />
          <FolderItem
            icon="settings"
            label="trip settings"
            subtitle="ownership, invite code"
            color={colors.taupe}
            onPress={() => router.push(`/trip/${id}/settings`)}
          />
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  titleBlock: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: 4,
  },
  title: {
    fontSize: 26,
  },
  list: {
    paddingHorizontal: spacing.lg,
    gap: 10,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 14,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  itemContent: {
    flex: 1,
    gap: 2,
  },
  itemLabel: {
    fontSize: 14,
    fontFamily: "InstrumentSans_500Medium",
  },
});
