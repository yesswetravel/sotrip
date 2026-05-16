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
} from "react-native";
import { Text } from "../../design-system";
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

export default function ItemSheet({ tripId, dayId, item, onClose }: ItemSheetProps) {
  const isEditing = !!item;
  const { show } = useToast();
  const createItem = useCreateItem(tripId);
  const updateItem = useUpdateItem(tripId);
  const deleteItem = useDeleteItem(tripId);

  const [title, setTitle] = useState(item?.title ?? "");
  const [subtitle, setSubtitle] = useState(item?.subtitle ?? "");
  const [time, setTime] = useState(item?.time ?? "");
  const [locationName, setLocationName] = useState(item?.location_name ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const canSave = title.trim().length > 0;

  async function handleSave() {
    if (!canSave) return;
    try {
      if (isEditing) {
        await updateItem.mutateAsync({
          itemId: item.id,
          patch: {
            title: title.trim(),
            subtitle: subtitle.trim() || null,
            time: time.trim() || null,
            location_name: locationName.trim() || null,
            notes: notes.trim() || null,
          },
        });
      } else {
        await createItem.mutateAsync({
          trip_day_id: dayId,
          title: title.trim(),
          subtitle: subtitle.trim() || undefined,
          time: time.trim() || undefined,
          location_name: locationName.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      }
      onClose();
    } catch {
      show("couldn't save item");
    }
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteItem.mutate(item!.id, {
      onSuccess: onClose,
      onError: () => show("couldn't delete item"),
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
            <Text variant="title" style={styles.sheetTitle}>
              {isEditing ? "edit item" : "new item"}
            </Text>

            <View style={styles.fields}>
              <TextInput
                style={styles.input}
                placeholder="what's happening?"
                placeholderTextColor={colors.stone}
                value={title}
                onChangeText={setTitle}
                autoFocus={!isEditing}
              />
              <TextInput
                style={styles.input}
                placeholder="subtitle (optional)"
                placeholderTextColor={colors.stone}
                value={subtitle}
                onChangeText={setSubtitle}
              />
              <TextInput
                style={styles.input}
                placeholder="time — e.g. 07:00 (optional)"
                placeholderTextColor={colors.stone}
                value={time}
                onChangeText={setTime}
                keyboardType="numbers-and-punctuation"
              />
              <TextInput
                style={styles.input}
                placeholder="location name (optional)"
                placeholderTextColor={colors.stone}
                value={locationName}
                onChangeText={setLocationName}
              />
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="notes (optional)"
                placeholderTextColor={colors.stone}
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!canSave}
              activeOpacity={0.8}
            >
              <Text variant="body" style={styles.saveBtnText}>
                {isEditing ? "save changes" : "add item"}
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
                  {confirmDelete ? "tap again to confirm delete" : "delete this item"}
                </Text>
              </TouchableOpacity>
            )}
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
    maxHeight: "85%",
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
  fields: {
    gap: 12,
    marginBottom: spacing.lg,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.sand,
    borderRadius: 8,
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
  saveBtn: {
    backgroundColor: colors.ink,
    borderRadius: 8,
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
    borderRadius: 8,
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
