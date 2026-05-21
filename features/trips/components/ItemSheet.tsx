import { useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Text } from "../../design-system";
import { LocationPicker, TimePicker, CategoryPicker } from "../../shared";
import { useToast } from "../../shared/toast-context";
import { useCreateItem, useUpdateItem, useDeleteItem } from "../hooks";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";
import type { TripItem } from "../../../types/database";

interface ItemSheetProps {
  tripId: string;
  dayId: string;
  item: TripItem | null;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/*  Field label                                                         */
/* ------------------------------------------------------------------ */

function FieldLabel({ label, icon }: { label: string; icon: keyof typeof Feather.glyphMap }) {
  return (
    <View style={styles.fieldLabel}>
      <Feather name={icon} size={12} color={colors.taupe} />
      <Text style={styles.fieldLabelText}>{label}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

export default function ItemSheet({ tripId, dayId, item, onClose }: ItemSheetProps) {
  const isEditing = !!item;
  const { show } = useToast();
  const createItem = useCreateItem(tripId);
  const updateItem = useUpdateItem(tripId);
  const deleteItem = useDeleteItem(tripId);

  const [title, setTitle] = useState(item?.title ?? "");
  const [time, setTime] = useState(item?.time ?? "");
  const [category, setCategory] = useState(item?.category ?? "other");
  const [locationName, setLocationName] = useState(item?.location_name ?? "");
  const [locationLat, setLocationLat] = useState(item?.location_lat ?? 0);
  const [locationLng, setLocationLng] = useState(item?.location_lng ?? 0);
  const [photoUri, setPhotoUri] = useState(item?.photo_uri ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [link, setLink] = useState(item?.link ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const canSave = title.trim().length > 0;

  function handleOpenMap() {
    if (!locationLat || !locationLng) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${locationLat},${locationLng}`;
    Linking.openURL(url);
  }

  async function handleSave() {
    if (!canSave) return;
    try {
      if (isEditing) {
        await updateItem.mutateAsync({
          itemId: item.id,
          patch: {
            title: title.trim(),
            time: time.trim() || null,
            category: category || null,
            location_name: locationName.trim() || null,
            location_lat: locationLat || null,
            location_lng: locationLng || null,
            photo_uri: photoUri.trim() || null,
            notes: notes.trim() || null,
            link: link.trim() || null,
          },
        });
      } else {
        await createItem.mutateAsync({
          trip_day_id: dayId,
          title: title.trim(),
          time: time.trim() || undefined,
          category: category || undefined,
          location_name: locationName.trim() || undefined,
          location_lat: locationLat || undefined,
          location_lng: locationLng || undefined,
          photo_uri: photoUri.trim() || undefined,
          notes: notes.trim() || undefined,
          link: link.trim() || undefined,
        });
      }
      onClose();
    } catch {
      show("couldn't save plan");
    }
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteItem.mutate(item!.id, {
      onSuccess: onClose,
      onError: () => show("couldn't delete plan"),
    });
  }

  return (
    <Modal visible animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <Text variant="title" style={styles.sheetTitle}>
              {isEditing ? "edit plan" : "add plan"}
            </Text>

            {/* Time */}
            <FieldLabel label="time" icon="clock" />
            <TimePicker
              value={time}
              onChange={setTime}
              onClear={() => setTime("")}
              placeholder="set time"
            />

            {/* Category */}
            <FieldLabel label="category" icon="tag" />
            <CategoryPicker value={category} onChange={setCategory} />

            {/* Plan (title) */}
            <FieldLabel label="plan" icon="edit-3" />
            <TextInput
              style={styles.input}
              placeholder="what's the plan?"
              placeholderTextColor={colors.stone}
              value={title}
              onChangeText={setTitle}
              autoFocus={!isEditing}
            />

            {/* Location */}
            <FieldLabel label="location" icon="map-pin" />
            <LocationPicker
              value={locationName}
              placeholder="search a place..."
              onSelect={(place) => {
                setLocationName(place.name);
                setLocationLat(place.lat);
                setLocationLng(place.lng);
                if (place.photo_uri) setPhotoUri(place.photo_uri);
              }}
              onClear={() => {
                setLocationName("");
                setLocationLat(0);
                setLocationLng(0);
                setPhotoUri("");
              }}
            />
            {locationName.trim().length > 0 && locationLat !== 0 && (
              <TouchableOpacity
                style={styles.mapLink}
                onPress={handleOpenMap}
                activeOpacity={0.7}
              >
                <Feather name="navigation" size={12} color={colors.teal} />
                <Text style={styles.mapLinkText}>open in maps</Text>
              </TouchableOpacity>
            )}

            {/* Note */}
            <FieldLabel label="note" icon="file-text" />
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="any details or reminders..."
              placeholderTextColor={colors.stone}
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            {/* Link */}
            <FieldLabel label="link or reference" icon="link" />
            <TextInput
              style={styles.input}
              placeholder="paste a URL (booking, article, etc.)"
              placeholderTextColor={colors.stone}
              value={link}
              onChangeText={setLink}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {link.trim().length > 0 && (
              <TouchableOpacity
                style={styles.mapLink}
                onPress={() => {
                  const url = link.startsWith("http") ? link : `https://${link}`;
                  Linking.openURL(url).catch(() => show("couldn't open link"));
                }}
                activeOpacity={0.7}
              >
                <Feather name="external-link" size={12} color={colors.teal} />
                <Text style={styles.mapLinkText}>open link</Text>
              </TouchableOpacity>
            )}

            {/* Save / Cancel / Delete */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!canSave}
                activeOpacity={0.8}
              >
                <Text variant="body" style={styles.saveBtnText}>
                  {isEditing ? "save changes" : "add plan"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text variant="body" style={styles.cancelText}>cancel</Text>
              </TouchableOpacity>

              {isEditing && (
                <TouchableOpacity
                  style={styles.deleteLink}
                  onPress={handleDelete}
                  activeOpacity={0.8}
                >
                  <Text variant="caption" style={styles.deleteLinkText}>
                    {confirmDelete ? "tap again to confirm delete" : "delete this plan"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: "90%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.mist,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  sheetTitle: {
    marginBottom: spacing.lg,
  },

  /* Field labels */
  fieldLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
    marginTop: spacing.md,
  },
  fieldLabelText: {
    fontSize: 10,
    textTransform: "uppercase" as const,
    letterSpacing: 1.2,
    color: colors.taupe,
    fontFamily: "Inter_600SemiBold",
  },

  /* Inputs */
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.sand,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.pearl,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },

  /* Map / link helpers */
  mapLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    paddingVertical: 4,
  },
  mapLinkText: {
    fontSize: 12,
    color: colors.teal,
    fontFamily: "Inter_500Medium",
  },

  /* Actions */
  actions: {
    marginTop: spacing.xl,
  },
  saveBtn: {
    backgroundColor: colors.ink,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    color: colors.ivory,
    fontFamily: "Inter_500Medium",
  },
  cancelBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.sand,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  cancelText: {
    color: colors.stone,
  },
  deleteLink: {
    alignItems: "center",
    paddingVertical: 8,
  },
  deleteLinkText: {
    color: "#C44",
  },
});
