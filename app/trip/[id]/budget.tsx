import { useState, useEffect, useCallback, useMemo } from "react";
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
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";

interface BudgetEntry {
  id: string;
  label: string;
  amount: number;
  category: string;
  paid: boolean;
}

const BUDGET_CATS = [
  { key: "flights", label: "flights", icon: "navigation" as const, color: colors.coral },
  { key: "accommodation", label: "stay", icon: "home" as const, color: colors.teal },
  { key: "food", label: "food", icon: "coffee" as const, color: colors.gold },
  { key: "transport", label: "transport", icon: "map" as const, color: colors.stone },
  { key: "activities", label: "activities", icon: "compass" as const, color: colors.teal },
  { key: "shopping", label: "shopping", icon: "shopping-bag" as const, color: colors.coral },
  { key: "other", label: "other", icon: "more-horizontal" as const, color: colors.sand },
];

function storageKey(tripId: string) {
  return `budget_${tripId}`;
}
function budgetLimitKey(tripId: string) {
  return `budget_limit_${tripId}`;
}

function fmt(amount: number): string {
  return "$" + amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function BudgetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: trip } = useTrip(id);

  const [entries, setEntries] = useState<BudgetEntry[]>([]);
  const [budgetLimit, setBudgetLimit] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newCategory, setNewCategory] = useState("food");

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(storageKey(id)),
      AsyncStorage.getItem(budgetLimitKey(id)),
    ]).then(([entriesRaw, limitRaw]) => {
      if (entriesRaw) setEntries(JSON.parse(entriesRaw));
      if (limitRaw) setBudgetLimit(limitRaw);
      setLoaded(true);
    });
  }, [id]);

  const persist = useCallback(
    (next: BudgetEntry[]) => {
      setEntries(next);
      AsyncStorage.setItem(storageKey(id), JSON.stringify(next));
    },
    [id]
  );

  function saveBudgetLimit(val: string) {
    setBudgetLimit(val);
    AsyncStorage.setItem(budgetLimitKey(id), val);
  }

  function addEntry() {
    const amount = parseFloat(newAmount);
    if (!newLabel.trim() || isNaN(amount)) return;
    const entry: BudgetEntry = {
      id: Date.now().toString(),
      label: newLabel.trim(),
      amount,
      category: newCategory,
      paid: false,
    };
    persist([...entries, entry]);
    setNewLabel("");
    setNewAmount("");
    setNewCategory("food");
    setShowAdd(false);
  }

  function togglePaid(entryId: string) {
    persist(entries.map((e) => (e.id === entryId ? { ...e, paid: !e.paid } : e)));
  }

  function deleteEntry(entryId: string) {
    persist(entries.filter((e) => e.id !== entryId));
  }

  const totalSpent = useMemo(
    () => entries.reduce((sum, e) => sum + e.amount, 0),
    [entries]
  );

  const limit = parseFloat(budgetLimit) || 0;
  const remaining = limit - totalSpent;
  const overBudget = limit > 0 && remaining < 0;
  const pct = limit > 0 ? Math.min((totalSpent / limit) * 100, 100) : 0;

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    entries.forEach((e) => {
      map.set(e.category, (map.get(e.category) || 0) + e.amount);
    });
    return BUDGET_CATS.filter((c) => map.has(c.key)).map((c) => ({
      ...c,
      total: map.get(c.key)!,
      pct: limit > 0 ? (map.get(c.key)! / limit) * 100 : 0,
    }));
  }, [entries, limit]);

  if (!loaded) return null;

  return (
    <Container>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
          <Feather name="chevron-left" size={16} color={colors.stone} />
          <Text variant="body" style={styles.backLink}>{trip?.title ?? "trip"}</Text>
        </TouchableOpacity>
      </View>

      <Text variant="display" style={styles.pageTitle}>budget</Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={styles.body}
      >
        {/* Budget hero */}
        <View style={styles.heroCard}>
          <Text variant="eyebrow" style={styles.heroLabel}>trip budget</Text>
          <View style={styles.heroAmountRow}>
            <Text variant="display" style={styles.heroDollar}>$</Text>
            <TextInput
              style={styles.heroInput}
              placeholder="0"
              placeholderTextColor={colors.sand}
              value={budgetLimit}
              onChangeText={saveBudgetLimit}
              keyboardType="numeric"
            />
          </View>
          {limit > 0 && (
            <View style={styles.heroBar}>
              <View
                style={[
                  styles.heroBarFill,
                  { width: `${pct}%` as any },
                  overBudget && { backgroundColor: "#C44" },
                ]}
              />
            </View>
          )}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text variant="caption" style={styles.statLabel}>spent</Text>
            <Text variant="title" style={styles.statValue}>{fmt(totalSpent)}</Text>
          </View>
          {limit > 0 && (
            <View style={styles.statCard}>
              <Text variant="caption" style={styles.statLabel}>remaining</Text>
              <Text
                variant="title"
                style={[styles.statValue, overBudget && styles.overBudgetText]}
              >
                {fmt(Math.abs(remaining))}
              </Text>
              {overBudget && (
                <Text variant="caption" style={styles.overLabel}>over budget</Text>
              )}
            </View>
          )}
          <View style={styles.statCard}>
            <Text variant="caption" style={styles.statLabel}>items</Text>
            <Text variant="title" style={styles.statValue}>{entries.length}</Text>
          </View>
        </View>

        {/* Category breakdown bars */}
        {byCategory.length > 0 && (
          <View style={styles.section}>
            <Text variant="eyebrow" style={styles.sectionLabel}>breakdown</Text>
            {byCategory.map((cat) => (
              <View key={cat.key} style={styles.catRow}>
                <View style={styles.catHeader}>
                  <Feather name={cat.icon} size={13} color={cat.color} />
                  <Text variant="caption" style={styles.catName}>{cat.label}</Text>
                  <Text variant="caption" style={styles.catAmount}>{fmt(cat.total)}</Text>
                </View>
                {limit > 0 && (
                  <View style={styles.catBar}>
                    <View
                      style={[
                        styles.catBarFill,
                        { width: `${cat.pct}%` as any, backgroundColor: cat.color },
                      ]}
                    />
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Expenses list */}
        <View style={styles.section}>
          <Text variant="eyebrow" style={styles.sectionLabel}>expenses</Text>
          {entries.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Feather name="dollar-sign" size={24} color={colors.taupe} />
              </View>
              <Text variant="titleItalic" style={styles.emptyText}>
                no expenses yet
              </Text>
              <Text variant="caption" style={styles.emptyHint}>
                track flights, hotels, meals & more
              </Text>
            </View>
          )}
          <View style={entries.length > 0 ? styles.entriesCard : undefined}>
            {entries.map((entry, idx) => {
              const cat = BUDGET_CATS.find((c) => c.key === entry.category) ?? BUDGET_CATS[6];
              return (
                <View
                  key={entry.id}
                  style={[
                    styles.entryRow,
                    idx < entries.length - 1 && styles.entryBorder,
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => togglePaid(entry.id)}
                    style={[
                      styles.paidDot,
                      entry.paid && { backgroundColor: cat.color, borderColor: cat.color },
                    ]}
                  >
                    {entry.paid && <Feather name="check" size={10} color={colors.ivory} />}
                  </TouchableOpacity>
                  <View style={styles.entryInfo}>
                    <Text
                      variant="body"
                      style={[styles.entryLabel, entry.paid && styles.entryPaid]}
                      numberOfLines={1}
                    >
                      {entry.label}
                    </Text>
                    <View style={styles.entryCatRow}>
                      <Feather name={cat.icon} size={10} color={cat.color} />
                      <Text variant="caption" style={{ color: cat.color, fontSize: 11 }}>
                        {cat.label}
                      </Text>
                    </View>
                  </View>
                  <Text variant="body" style={styles.entryAmount}>{fmt(entry.amount)}</Text>
                  <TouchableOpacity
                    onPress={() => deleteEntry(entry.id)}
                    hitSlop={8}
                    style={styles.deleteBtn}
                  >
                    <Feather name="x" size={12} color={colors.mist} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowAdd(true)}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={16} color={colors.ivory} style={{ marginRight: 6 }} />
        <Text variant="body" style={styles.addButtonText}>add expense</Text>
      </TouchableOpacity>

      {/* Add sheet */}
      {showAdd && (
        <Modal visible animationType="slide" transparent>
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setShowAdd(false)}
          >
            <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={() => {}}>
              <View style={styles.handle} />
              <Text variant="title" style={styles.sheetTitle}>new expense</Text>

              <TextInput
                style={styles.input}
                placeholder="what was it for?"
                placeholderTextColor={colors.sand}
                value={newLabel}
                onChangeText={setNewLabel}
                autoFocus
              />
              <View style={styles.amountInputRow}>
                <Text variant="body" style={styles.amountDollar}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0"
                  placeholderTextColor={colors.sand}
                  value={newAmount}
                  onChangeText={setNewAmount}
                  keyboardType="numeric"
                />
              </View>

              {/* Category selector */}
              <Text variant="eyebrow" style={styles.catSectionLabel}>category</Text>
              <View style={styles.catGrid}>
                {BUDGET_CATS.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.catChip,
                      newCategory === cat.key && { backgroundColor: cat.color, borderColor: cat.color },
                    ]}
                    onPress={() => setNewCategory(cat.key)}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name={cat.icon}
                      size={12}
                      color={newCategory === cat.key ? colors.ivory : colors.stone}
                    />
                    <Text
                      variant="caption"
                      style={{
                        color: newCategory === cat.key ? colors.ivory : colors.stone,
                        fontSize: 11,
                        fontFamily: "Inter_500Medium",
                      }}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.saveBtn, (!newLabel.trim() || !newAmount) && styles.saveBtnDisabled]}
                onPress={addEntry}
                disabled={!newLabel.trim() || !newAmount}
                activeOpacity={0.8}
              >
                <Text variant="body" style={styles.saveBtnText}>add expense</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAdd(false)}
                activeOpacity={0.8}
              >
                <Text variant="body" style={styles.cancelText}>cancel</Text>
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
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backLink: {
    color: colors.stone,
    fontSize: 13,
  },
  pageTitle: {
    textAlign: "center",
    marginBottom: spacing.md,
  },
  body: {
    flex: 1,
  },
  heroCard: {
    backgroundColor: colors.pearl,
    borderRadius: 14,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  heroLabel: {
    marginBottom: 8,
  },
  heroAmountRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  heroDollar: {
    fontSize: 24,
    color: colors.taupe,
  },
  heroInput: {
    fontSize: 36,
    fontFamily: "CormorantGaramond_700Bold",
    color: colors.ink,
    minWidth: 50,
    textAlign: "center",
    paddingVertical: 0,
  },
  heroBar: {
    width: "100%",
    height: 4,
    backgroundColor: colors.mist,
    borderRadius: 2,
    marginTop: 12,
    overflow: "hidden",
  },
  heroBarFill: {
    height: 4,
    backgroundColor: colors.moss,
    borderRadius: 2,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.pearl,
    borderRadius: 10,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
    alignItems: "center",
    gap: 2,
  },
  statLabel: {
    color: colors.stone,
    fontSize: 10,
  },
  statValue: {
    fontSize: 18,
    color: colors.ink,
  },
  overBudgetText: {
    color: "#C44",
  },
  overLabel: {
    color: "#C44",
    fontSize: 9,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    marginBottom: spacing.sm,
  },
  catRow: {
    marginBottom: 10,
  },
  catHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  catName: {
    flex: 1,
    fontSize: 12,
    color: colors.ink,
    fontFamily: "Inter_500Medium",
  },
  catAmount: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: colors.ink,
  },
  catBar: {
    height: 3,
    backgroundColor: colors.mist,
    borderRadius: 2,
    overflow: "hidden",
  },
  catBarFill: {
    height: 3,
    borderRadius: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xl * 1.5,
    gap: 8,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.taupe + "14",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyText: {
    color: colors.stone,
  },
  emptyHint: {
    color: colors.sand,
  },
  entriesCard: {
    backgroundColor: colors.pearl,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
    overflow: "hidden",
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  entryBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.mist,
  },
  paidDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.sand,
    alignItems: "center",
    justifyContent: "center",
  },
  entryInfo: {
    flex: 1,
    gap: 2,
  },
  entryLabel: {
    fontSize: 14,
    color: colors.ink,
  },
  entryPaid: {
    textDecorationLine: "line-through",
    color: colors.stone,
    opacity: 0.6,
  },
  entryCatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  entryAmount: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: colors.ink,
  },
  deleteBtn: {
    padding: 4,
    opacity: 0.4,
  },
  addButton: {
    position: "absolute",
    bottom: 24,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.ink,
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: colors.ivory,
    fontFamily: "Inter_500Medium",
  },
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
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.mist,
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    marginBottom: spacing.md,
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
    marginBottom: 12,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.sand,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.pearl,
    marginBottom: spacing.md,
  },
  amountDollar: {
    color: colors.taupe,
    fontSize: 18,
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 18,
    color: colors.ink,
  },
  catSectionLabel: {
    marginBottom: 8,
  },
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: spacing.lg,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.sand,
    backgroundColor: colors.pearl,
  },
  saveBtn: {
    backgroundColor: colors.ink,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  saveBtnDisabled: {
    opacity: 0.3,
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
  },
  cancelText: {
    color: colors.stone,
  },
});
