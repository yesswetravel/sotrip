import { useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Container, Text, Card } from "../../../../features/design-system";
import { CalendarStrip } from "../../../../features/shared";
import { useToast } from "../../../../features/shared/toast-context";
import ItemSheet from "../../../../features/trips/components/ItemSheet";
import {
  useTrip,
  useDeleteItem,
  useUpdateDayNotes,
} from "../../../../features/trips/hooks";
import { colors } from "../../../../theme/colors";
import { spacing } from "../../../../theme/spacing";
import type { TripItem } from "../../../../types/database";

function SwipeableItem({
  item,
  onTap,
  onDelete,
}: {
  item: TripItem;
  onTap: () => void;
  onDelete: () => void;
}) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <View style={styles.swipeContainer}>
      {showDelete && (
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} activeOpacity={0.8}>
          <Text variant="body" style={styles.deleteText}>delete</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={styles.itemCard}
        onPress={onTap}
        onLongPress={() => setShowDelete(!showDelete)}
        activeOpacity={0.85}
      >
        <View style={styles.itemRow}>
          {item.time && (
            <Text variant="caption" style={styles.itemTime}>{item.time}</Text>
          )}
          <View style={styles.itemContent}>
            <Text variant="body" style={styles.itemTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {item.subtitle && (
              <Text variant="caption" numberOfLines={1}>{item.subtitle}</Text>
            )}
            {item.location_name && (
              <Text variant="eyebrow" style={styles.itemLocation}>
                {item.location_name}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

export default function DayViewScreen() {
  const { id, n } = useLocalSearchParams<{ id: string; n: string }>();
  const router = useRouter();
  const { show } = useToast();
  const dayNumber = parseInt(n, 10);

  const { data: trip } = useTrip(id);
  const deleteItemMutation = useDeleteItem(id);
  const updateNotesMutation = useUpdateDayNotes(id);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<TripItem | null>(null);

  const currentDay = useMemo(
    () => trip?.trip_days.find((d) => d.day_number === dayNumber),
    [trip, dayNumber]
  );

  const items = useMemo(() => {
    if (!currentDay) return [];
    return [...currentDay.trip_items].sort((a, b) => {
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;
      return a.sort_order - b.sort_order;
    });
  }, [currentDay]);

  const calendarDays = useMemo(
    () =>
      trip?.trip_days.map((d) => ({
        dayNumber: d.day_number,
        date: d.date ?? "",
      })) ?? [],
    [trip]
  );

  const [localNotes, setLocalNotes] = useState<string | null>(null);
  const notesValue = localNotes ?? currentDay?.notes ?? "";

  const handleNotesBlur = useCallback(() => {
    if (!currentDay || localNotes === null) return;
    updateNotesMutation.mutate(
      { dayId: currentDay.id, notes: localNotes },
      { onError: () => show("couldn't save notes") }
    );
    setLocalNotes(null);
  }, [currentDay, localNotes]);

  function handleDeleteItem(itemId: string) {
    deleteItemMutation.mutate(itemId, {
      onError: () => show("couldn't delete item"),
    });
  }

  function handleEditItem(item: TripItem) {
    setEditingItem(item);
    setSheetVisible(true);
  }

  function handleAddItem() {
    setEditingItem(null);
    setSheetVisible(true);
  }

  function formatDayDate(dateStr: string | null): string {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    return d
      .toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
      .toLowerCase();
  }

  if (!trip || !currentDay) return null;

  return (
    <Container>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text variant="body" style={styles.backLink}>← {trip.title}</Text>
        </TouchableOpacity>
      </View>

      <Text variant="display" style={styles.dayTitle}>
        day {String(dayNumber).padStart(2, "0")}
      </Text>
      <Text variant="eyebrow" style={styles.dayDate}>
        {formatDayDate(currentDay.date)}
      </Text>

      {/* Calendar strip */}
      <View style={styles.strip}>
        <CalendarStrip
          days={calendarDays}
          selectedDay={dayNumber}
          onSelectDay={(num) => router.replace(`/trip/${id}/day/${num}`)}
          todayDate={new Date().toISOString().split("T")[0]}
        />
      </View>

      <ScrollView
        style={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Items */}
        {items.length === 0 ? (
          <View style={styles.emptyItems}>
            <Text variant="titleItalic" style={styles.emptyText}>
              nothing planned yet
            </Text>
          </View>
        ) : (
          items.map((item) => (
            <SwipeableItem
              key={item.id}
              item={item}
              onTap={() => handleEditItem(item)}
              onDelete={() => handleDeleteItem(item.id)}
            />
          ))
        )}

        {/* Notes */}
        <View style={styles.notesSection}>
          <Text variant="eyebrow" style={styles.notesLabel}>notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="notes for the day…"
            placeholderTextColor={colors.stone}
            value={notesValue}
            onChangeText={setLocalNotes}
            onBlur={handleNotesBlur}
            multiline
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddItem} activeOpacity={0.85}>
        <Text variant="body" style={styles.addButtonText}>+ add to day</Text>
      </TouchableOpacity>

      {/* Item Sheet */}
      {sheetVisible && (
        <ItemSheet
          tripId={id}
          dayId={currentDay.id}
          item={editingItem}
          onClose={() => {
            setSheetVisible(false);
            setEditingItem(null);
          }}
        />
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  backLink: {
    color: colors.stone,
    fontSize: 13,
  },
  dayTitle: {
    textAlign: "center",
  },
  dayDate: {
    textAlign: "center",
    marginTop: 4,
    marginBottom: spacing.md,
  },
  strip: {
    marginBottom: spacing.md,
  },
  body: {
    flex: 1,
  },
  emptyItems: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  emptyText: {
    color: colors.stone,
  },
  swipeContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  deleteBtn: {
    backgroundColor: "#C44",
    borderRadius: 8,
    justifyContent: "center",
    paddingHorizontal: 16,
    marginRight: 8,
  },
  deleteText: {
    color: colors.pearl,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  itemCard: {
    flex: 1,
    backgroundColor: colors.pearl,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
    padding: spacing.md,
  },
  itemRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  itemTime: {
    width: 44,
    paddingTop: 2,
  },
  itemContent: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: 16,
  },
  itemLocation: {
    marginTop: 4,
  },
  notesSection: {
    marginTop: spacing.lg,
  },
  notesLabel: {
    marginBottom: spacing.sm,
  },
  notesInput: {
    backgroundColor: colors.pearl,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
    padding: spacing.md,
    minHeight: 80,
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 16,
    color: colors.ink,
    textAlignVertical: "top",
  },
  addButton: {
    position: "absolute",
    bottom: 24,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.ink,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  addButtonText: {
    color: colors.ivory,
    fontFamily: "Inter_500Medium",
  },
});
