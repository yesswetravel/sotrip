import { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Container, Text } from "../../../features/design-system";
import { useTrip } from "../../../features/trips/hooks";
import { useColors } from "../../../features/theme/ThemeProvider";
import { spacing } from "../../../theme/spacing";

interface NoteEntry {
  id: string;
  title: string;
  body: string;
  color: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

function storageKey(tripId: string) {
  return `notes_${tripId}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toLowerCase();
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return formatDate(iso);
}

export default function NotesScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: trip } = useTrip(id);

  const NOTE_COLORS = [
    { key: "ivory", value: colors.pearl, label: "white" },
    { key: "mist", value: colors.mist, label: "mist" },
    { key: "teal", value: colors.teal + "14", label: "sage" },
    { key: "gold", value: colors.gold + "14", label: "gold" },
    { key: "coral", value: colors.coral + "14", label: "rose" },
  ];

  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteEntry | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editColor, setEditColor] = useState(NOTE_COLORS[0].value);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(storageKey(id)).then((raw) => {
      if (raw) setNotes(JSON.parse(raw));
      setLoaded(true);
    });
  }, [id]);

  const persist = useCallback(
    (next: NoteEntry[]) => {
      setNotes(next);
      AsyncStorage.setItem(storageKey(id), JSON.stringify(next));
    },
    [id]
  );

  function openNewNote() {
    const note: NoteEntry = {
      id: Date.now().toString(),
      title: "",
      body: "",
      color: NOTE_COLORS[0].value,
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingNote(note);
    setEditTitle("");
    setEditBody("");
    setEditColor(NOTE_COLORS[0].value);
    setConfirmDelete(false);
  }

  function openEditNote(note: NoteEntry) {
    setEditingNote(note);
    setEditTitle(note.title);
    setEditBody(note.body);
    setEditColor(note.color);
    setConfirmDelete(false);
  }

  function saveNote() {
    if (!editingNote) return;
    const title = editTitle.trim();
    const body = editBody.trim();
    if (!title && !body) {
      setEditingNote(null);
      return;
    }
    const updated: NoteEntry = {
      ...editingNote,
      title: title || "untitled",
      body,
      color: editColor,
      updatedAt: new Date().toISOString(),
    };
    const exists = notes.find((n) => n.id === updated.id);
    if (exists) {
      persist(notes.map((n) => (n.id === updated.id ? updated : n)));
    } else {
      persist([updated, ...notes]);
    }
    setEditingNote(null);
  }

  function deleteNote(noteId: string) {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    persist(notes.filter((n) => n.id !== noteId));
    setEditingNote(null);
    setConfirmDelete(false);
  }

  function togglePin(noteId: string) {
    persist(notes.map((n) => (n.id === noteId ? { ...n, pinned: !n.pinned } : n)));
  }

  // Sort: pinned first, then by updatedAt
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  if (!loaded) return null;

  return (
    <Container logo>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
          <Feather name="chevron-left" size={16} color={colors.stone} />
          <Text variant="body" style={[styles.backLink, { color: colors.stone }]}>{trip?.title ?? "trip"}</Text>
        </TouchableOpacity>
      </View>

      <Text variant="display" style={styles.pageTitle}>notes</Text>
      <Text variant="eyebrow" style={styles.subtitle}>
        {notes.length} {notes.length === 1 ? "note" : "notes"}
      </Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.body}
      >
        {notes.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.taupe + "14" }]}>
              <Feather name="edit-3" size={24} color={colors.taupe} />
            </View>
            <Text variant="titleItalic" style={{ color: colors.stone }}>
              jot down trip ideas
            </Text>
            <Text variant="caption" style={[styles.emptyHint, { color: colors.sand }]}>
              restaurant recommendations, phrases to learn, tips from friends
            </Text>
          </View>
        )}

        {/* Notes grid */}
        <View style={styles.notesGrid}>
          {sortedNotes.map((note) => (
            <TouchableOpacity
              key={note.id}
              style={[
                styles.noteCard,
                { backgroundColor: note.color || colors.pearl, borderColor: colors.mist, shadowColor: colors.ink },
              ]}
              onPress={() => openEditNote(note)}
              onLongPress={() => togglePin(note.id)}
              activeOpacity={0.7}
            >
              {note.pinned && (
                <View style={styles.pinBadge}>
                  <Feather name="bookmark" size={10} color={colors.taupe} />
                </View>
              )}
              {note.title ? (
                <Text variant="body" style={[styles.noteTitle, { color: colors.ink }]} numberOfLines={1}>
                  {note.title}
                </Text>
              ) : null}
              {note.body ? (
                <Text variant="caption" style={[styles.noteBody, { color: colors.stone }]} numberOfLines={5}>
                  {note.body}
                </Text>
              ) : null}
              <Text variant="caption" style={[styles.noteDate, { color: colors.sand }]}>
                {timeAgo(note.updatedAt)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.ink }]}
        onPress={openNewNote}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={16} color={colors.ivory} style={{ marginRight: 6 }} />
        <Text variant="body" style={{ color: colors.ivory, fontFamily: "Inter_500Medium" }}>new note</Text>
      </TouchableOpacity>

      {/* Edit modal */}
      {editingNote && (
        <Modal visible animationType="slide" transparent>
          <View style={styles.overlay}>
            <View style={[styles.sheet, { backgroundColor: editColor || colors.ivory }]}>
              <View style={[styles.handle, { backgroundColor: colors.mist }]} />

              {/* Top bar */}
              <View style={styles.sheetHeader}>
                <TouchableOpacity onPress={saveNote} activeOpacity={0.7}>
                  <Text variant="body" style={[styles.doneText, { color: colors.taupe }]}>done</Text>
                </TouchableOpacity>
                <View style={styles.sheetActions}>
                  <TouchableOpacity
                    onPress={() => togglePin(editingNote.id)}
                    activeOpacity={0.7}
                    style={styles.sheetActionBtn}
                  >
                    <Feather
                      name="bookmark"
                      size={16}
                      color={editingNote.pinned ? colors.taupe : colors.sand}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteNote(editingNote.id)}
                    activeOpacity={0.7}
                    style={styles.sheetActionBtn}
                  >
                    <Feather
                      name="trash-2"
                      size={16}
                      color={confirmDelete ? "#C44" : colors.sand}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {confirmDelete && (
                <View style={styles.deleteConfirm}>
                  <Text variant="caption" style={styles.deleteConfirmText}>
                    tap delete again to confirm
                  </Text>
                </View>
              )}

              {/* Color picker */}
              <View style={styles.colorRow}>
                {NOTE_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c.key}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c.value, borderColor: colors.sand },
                      editColor === c.value && { borderWidth: 2, borderColor: colors.taupe },
                    ]}
                    onPress={() => setEditColor(c.value)}
                    activeOpacity={0.7}
                  />
                ))}
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <TextInput
                  style={[styles.titleInput, { color: colors.ink }]}
                  placeholder="title"
                  placeholderTextColor={colors.sand}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  autoFocus={!editingNote.title}
                />
                <TextInput
                  style={[styles.bodyInput, { color: colors.ink }]}
                  placeholder="start writing…"
                  placeholderTextColor={colors.sand}
                  value={editBody}
                  onChangeText={setEditBody}
                  multiline
                  autoFocus={!!editingNote.title}
                />
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backLink: {
    fontSize: 13,
  },
  pageTitle: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginTop: 4,
    marginBottom: spacing.md,
  },
  body: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xl * 2,
    gap: 10,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyHint: {
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  notesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  noteCard: {
    width: "48%" as any,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 130,
    justifyContent: "space-between",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  pinBadge: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  noteTitle: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    marginBottom: 6,
  },
  noteBody: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "CormorantGaramond_500Medium_Italic",
    flex: 1,
  },
  noteDate: {
    fontSize: 10,
    marginTop: 10,
  },
  addButton: {
    position: "absolute",
    bottom: 24,
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: "85%",
    minHeight: "55%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  doneText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  sheetActions: {
    flexDirection: "row",
    gap: 12,
  },
  sheetActionBtn: {
    padding: 4,
  },
  deleteConfirm: {
    backgroundColor: "#C4414",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: spacing.sm,
    alignSelf: "flex-end",
  },
  deleteConfirmText: {
    color: "#C44",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  colorRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: spacing.md,
  },
  colorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
  },
  titleInput: {
    fontSize: 24,
    fontFamily: "CormorantGaramond_700Bold",
    marginBottom: spacing.sm,
    paddingVertical: 4,
  },
  bodyInput: {
    fontSize: 16,
    fontFamily: "CormorantGaramond_500Medium_Italic",
    lineHeight: 26,
    minHeight: 200,
    textAlignVertical: "top",
  },
});
