import {
  StyleSheet,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  Linking,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "../../design-system";
import { getCategoryForItem } from "../../../theme/categories";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";
import type { TripItem } from "../../../types/database";

interface Props {
  item: TripItem;
  onClose: () => void;
  onEdit: () => void;
}

function formatTime12h(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const suffix = h >= 12 ? "pm" : "am";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${mStr} ${suffix}`;
}

function openInMaps(name: string, lat: number, lng: number) {
  const label = encodeURIComponent(name);
  const url =
    Platform.OS === "ios"
      ? `maps:0,0?q=${label}@${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${label}`;
  Linking.openURL(url).catch(() => {
    // fallback to google maps web
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    );
  });
}

export default function ItemDetailSheet({ item, onClose, onEdit }: Props) {
  const cat = getCategoryForItem(item.category);
  const hasLocation = item.location_name && item.location_lat && item.location_lng;

  return (
    <Modal visible animationType="slide" transparent>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.sheet}
          activeOpacity={1}
          onPress={() => {}}
        >
          <View style={styles.handle} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Category + time row */}
            <View style={styles.topRow}>
              <View style={[styles.catPill, { backgroundColor: cat.color + "18" }]}>
                <Feather name={cat.icon} size={13} color={cat.color} />
                <Text variant="caption" style={[styles.catLabel, { color: cat.color }]}>
                  {cat.label}
                </Text>
              </View>
              {item.time && (
                <Text variant="caption" style={styles.timeLabel}>
                  {formatTime12h(item.time)}
                </Text>
              )}
            </View>

            {/* Title */}
            <Text variant="title" style={styles.title}>
              {item.title}
            </Text>

            {/* Subtitle */}
            {item.subtitle && (
              <Text variant="body" style={styles.subtitle}>
                {item.subtitle}
              </Text>
            )}

            {/* Location — tappable to open map */}
            {item.location_name && (
              <TouchableOpacity
                style={styles.locationCard}
                activeOpacity={hasLocation ? 0.7 : 1}
                onPress={() => {
                  if (hasLocation) {
                    openInMaps(
                      item.location_name!,
                      item.location_lat!,
                      item.location_lng!
                    );
                  }
                }}
              >
                <View style={styles.locationIcon}>
                  <Feather name="map-pin" size={16} color={colors.taupe} />
                </View>
                <View style={styles.locationInfo}>
                  <Text variant="body" style={styles.locationName}>
                    {item.location_name}
                  </Text>
                  {hasLocation && (
                    <Text variant="caption" style={styles.locationAction}>
                      open in maps →
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}

            {/* Notes */}
            {item.notes && (
              <View style={styles.notesSection}>
                <Text variant="eyebrow" style={styles.notesLabel}>notes</Text>
                <Text variant="body" style={styles.notesText}>
                  {item.notes}
                </Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={onEdit}
                activeOpacity={0.8}
              >
                <Feather name="edit-2" size={14} color={colors.ivory} style={{ marginRight: 6 }} />
                <Text variant="body" style={styles.editBtnText}>edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text variant="body" style={styles.closeBtnText}>close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  sheet: {
    backgroundColor: colors.ivory,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: "70%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.mist,
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  catLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  timeLabel: {
    fontSize: 13,
    color: colors.taupe,
    fontFamily: "Inter_500Medium",
  },
  title: {
    fontSize: 22,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.stone,
    fontSize: 15,
    marginBottom: spacing.md,
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.pearl,
    borderRadius: 10,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
  },
  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.taupe + "14",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: colors.ink,
  },
  locationAction: {
    fontSize: 12,
    color: colors.taupe,
    marginTop: 2,
  },
  notesSection: {
    marginBottom: spacing.lg,
  },
  notesLabel: {
    marginBottom: 6,
  },
  notesText: {
    color: colors.stone,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "CormorantGaramond_500Medium_Italic",
  },
  actions: {
    gap: 10,
    marginTop: spacing.md,
  },
  editBtn: {
    backgroundColor: colors.ink,
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  editBtnText: {
    color: colors.ivory,
    fontFamily: "Inter_500Medium",
  },
  closeBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.sand,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  closeBtnText: {
    color: colors.stone,
  },
});
