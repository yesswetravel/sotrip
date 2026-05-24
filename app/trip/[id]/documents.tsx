import { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Container, Text } from "../../../features/design-system";
import { goBack } from "../../../lib/go-back";
import { useTrip } from "../../../features/trips/hooks";
import { useColors } from "../../../features/theme/ThemeProvider";
import { spacing } from "../../../theme/spacing";

interface DocItem {
  id: string;
  name: string;
  type: string;
  status: "not_started" | "in_progress" | "ready";
  notes: string;
  expiryDate: string;
}

const DOC_TYPES = [
  { key: "passport", label: "passport", icon: "book" as const },
  { key: "visa", label: "visa", icon: "globe" as const },
  { key: "insurance", label: "travel insurance", icon: "shield" as const },
  { key: "flight", label: "flight booking", icon: "navigation" as const },
  { key: "hotel", label: "hotel booking", icon: "home" as const },
  { key: "other", label: "other", icon: "file" as const },
];

function storageKey(tripId: string) {
  return `documents_${tripId}`;
}

export default function DocumentsScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: trip } = useTrip(id);

  const STATUS_CONFIG = {
    not_started: { label: "not started", color: colors.sand, icon: "circle" as const },
    in_progress: { label: "in progress", color: colors.gold, icon: "loader" as const },
    ready: { label: "ready", color: colors.teal, icon: "check-circle" as const },
  } as const;

  const [docs, setDocs] = useState<DocItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showAddSheet, setShowAddSheet] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(storageKey(id)).then((raw) => {
      if (raw) setDocs(JSON.parse(raw));
      setLoaded(true);
    });
  }, [id]);

  const persist = useCallback(
    (next: DocItem[]) => {
      setDocs(next);
      AsyncStorage.setItem(storageKey(id), JSON.stringify(next));
    },
    [id]
  );

  function addDoc(type: string, label: string) {
    const doc: DocItem = {
      id: Date.now().toString(),
      name: label,
      type,
      status: "not_started",
      notes: "",
      expiryDate: "",
    };
    persist([...docs, doc]);
    setShowAddSheet(false);
  }

  function cycleStatus(docId: string) {
    const order: DocItem["status"][] = ["not_started", "in_progress", "ready"];
    persist(
      docs.map((d) => {
        if (d.id !== docId) return d;
        const idx = order.indexOf(d.status);
        return { ...d, status: order[(idx + 1) % order.length] };
      })
    );
  }

  function deleteDoc(docId: string) {
    persist(docs.filter((d) => d.id !== docId));
  }

  function updateNotes(docId: string, notes: string) {
    persist(docs.map((d) => (d.id === docId ? { ...d, notes } : d)));
  }

  const readyCount = docs.filter((d) => d.status === "ready").length;
  const inProgressCount = docs.filter((d) => d.status === "in_progress").length;

  if (!loaded) return <Container logo><ActivityIndicator size="small" style={{ marginTop: 40 }} /></Container>;

  return (
    <Container logo>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBack(router)} activeOpacity={0.7}>
          <Feather name="chevron-left" size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text variant="eyebrow">{trip?.title ?? "trip"}</Text>
        <View style={{ width: 20 }} />
      </View>

      <Text variant="display" style={styles.pageTitle}>documents</Text>

      {/* Status summary */}
      {docs.length > 0 && (
        <View style={styles.statusSummary}>
          <View style={styles.statusChip}>
            <View style={[styles.statusIndicator, { backgroundColor: colors.moss }]} />
            <Text variant="caption" style={[styles.statusChipText, { color: colors.stone }]}>
              {readyCount} ready
            </Text>
          </View>
          {inProgressCount > 0 && (
            <View style={styles.statusChip}>
              <View style={[styles.statusIndicator, { backgroundColor: colors.gold }]} />
              <Text variant="caption" style={[styles.statusChipText, { color: colors.stone }]}>
                {inProgressCount} in progress
              </Text>
            </View>
          )}
          <View style={styles.statusChip}>
            <View style={[styles.statusIndicator, { backgroundColor: colors.sand }]} />
            <Text variant="caption" style={[styles.statusChipText, { color: colors.stone }]}>
              {docs.length - readyCount - inProgressCount} pending
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={styles.body}
      >
        {docs.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.taupe + "14" }]}>
              <Feather name="file-text" size={28} color={colors.taupe} />
            </View>
            <Text variant="titleItalic" style={{ color: colors.stone }}>
              no documents added yet
            </Text>
            <Text variant="caption" style={[styles.emptyHint, { color: colors.sand }]}>
              keep track of passports, visas, bookings & insurance
            </Text>
          </View>
        )}

        {docs.map((doc) => {
          const statusCfg = STATUS_CONFIG[doc.status];
          const typeInfo = DOC_TYPES.find((t) => t.key === doc.type) ?? DOC_TYPES[5];
          return (
            <View key={doc.id} style={[styles.docCard, { backgroundColor: colors.pearl, borderColor: colors.mist }]}>
              <View style={styles.docTopRow}>
                <View style={[styles.docIconWrap, { backgroundColor: statusCfg.color + "14" }]}>
                  <Feather name={typeInfo.icon} size={16} color={statusCfg.color} />
                </View>
                <View style={styles.docInfo}>
                  <Text variant="body" style={[styles.docName, { color: colors.ink }]}>{doc.name}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => deleteDoc(doc.id)}
                  style={styles.deleteBtn}
                  hitSlop={8}
                >
                  <Feather name="x" size={14} color={colors.mist} />
                </TouchableOpacity>
              </View>

              {/* Status toggle */}
              <TouchableOpacity
                onPress={() => cycleStatus(doc.id)}
                style={[styles.statusRow, { backgroundColor: statusCfg.color + "0C" }]}
                activeOpacity={0.7}
              >
                <Feather name={statusCfg.icon} size={13} color={statusCfg.color} />
                <Text variant="caption" style={[styles.statusLabel, { color: statusCfg.color }]}>
                  {statusCfg.label}
                </Text>
                <Text variant="caption" style={{ fontSize: 10, color: colors.sand }}>tap to change</Text>
              </TouchableOpacity>

              {/* Notes */}
              <TextInput
                style={[styles.docNotes, { color: colors.stone }]}
                placeholder="add notes…"
                placeholderTextColor={colors.sand}
                value={doc.notes}
                onChangeText={(t) => updateNotes(doc.id, t)}
                multiline
              />
            </View>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.ink }]}
        onPress={() => setShowAddSheet(true)}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={16} color={colors.ivory} style={{ marginRight: 6 }} />
        <Text variant="body" style={{ color: colors.ivory, fontFamily: "InstrumentSans_500Medium" }}>add document</Text>
      </TouchableOpacity>

      {/* Add sheet */}
      {showAddSheet && (
        <Modal visible animationType="slide" transparent>
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setShowAddSheet(false)}
          >
            <TouchableOpacity style={[styles.sheet, { backgroundColor: colors.ivory }]} activeOpacity={1} onPress={() => {}}>
              <View style={[styles.handle, { backgroundColor: colors.mist }]} />
              <Text variant="title" style={styles.sheetTitle}>add document</Text>
              <Text variant="caption" style={[styles.sheetHint, { color: colors.sand }]}>
                choose a document type to track
              </Text>
              {DOC_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[styles.typeRow, { borderBottomColor: colors.mist }]}
                  onPress={() => addDoc(type.key, type.label)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.typeIcon, { backgroundColor: colors.taupe + "14" }]}>
                    <Feather name={type.icon} size={16} color={colors.taupe} />
                  </View>
                  <Text variant="body" style={[styles.typeLabel, { color: colors.ink }]}>{type.label}</Text>
                  <Feather name="plus" size={14} color={colors.sand} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.sand }]}
                onPress={() => setShowAddSheet(false)}
                activeOpacity={0.8}
              >
                <Text variant="body" style={{ color: colors.stone }}>cancel</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  pageTitle: {
    textAlign: "center",
  },
  statusSummary: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 8,
    marginBottom: spacing.md,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusChipText: {
    fontSize: 11,
  },
  body: {
    flex: 1,
    marginTop: spacing.sm,
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
  docCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    marginBottom: 12,
  },
  docTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  docIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 16,
    fontFamily: "InstrumentSans_500Medium",
  },
  deleteBtn: {
    padding: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: 12,
    fontFamily: "InstrumentSans_500Medium",
    flex: 1,
  },
  docNotes: {
    marginTop: 8,
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 14,
    lineHeight: 18,
    minHeight: 20,
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
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    marginBottom: 4,
  },
  sheetHint: {
    marginBottom: spacing.md,
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  typeLabel: {
    flex: 1,
    fontSize: 15,
  },
  cancelBtn: {
    marginTop: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
});
