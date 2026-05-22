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
import { useColors } from "../../../features/theme/ThemeProvider";
import { spacing } from "../../../theme/spacing";

interface BudgetEntry {
  id: string;
  label: string;
  amount: number;
  category: string;
  paid: boolean;
}

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
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: trip } = useTrip(id);

  const BUDGET_CATS = [
    { key: "flights", label: "flights", icon: "navigation" as const, color: colors.coral },
    { key: "accommodation", label: "stay", icon: "home" as const, color: colors.teal },
    { key: "food", label: "food", icon: "coffee" as const, color: colors.gold },
    { key: "transport", label: "transport", icon: "map" as const, color: colors.stone },
    { key: "activities", label: "activities", icon: "compass" as const, color: colors.teal },
    { key: "shopping", label: "shopping", icon: "shopping-bag" as const, color: colors.coral },
    { key: "other", label: "other", icon: "more-horizontal" as const, color: colors.sand },
  ];

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
    <Container logo>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="chevron-left" size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text variant="eyebrow">{trip?.title ?? "trip"}</Text>
        <View style={{ width: 20 }} />
      </View>

      <Text variant="display" style={styles.pageTitle}>budget</Text>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={styles.body}
      >
        {/* Budget hero */}
        <View style={[styles.heroCard, { backgroundColor: colors.pearl, borderColor: colors.mist }]}>
          <Text variant="eyebrow" style={styles.heroLabel}>trip budget</Text>
          <View style={styles.heroAmountRow}>
            <Text variant="display" style={[styles.heroDollar, { color: colors.taupe }]}>$</Text>
            <TextInput
              style={[styles.heroInput, { color: colors.ink }]}
              placeholder="0"
              placeholderTextColor={colors.sand}
              value={budgetLimit}
              onChangeText={saveBudgetLimit}
              keyboardType="numeric"
            />
          </View>
          {limit > 0 && (
            <View style={[styles.heroBar, { backgroundColor: colors.mist }]}>
              <View
                style={[
                  styles.heroBarFill,
                  { width: `${pct}%` as any, backgroundColor: colors.moss },
                  overBudget && { backgroundColor: "#C44" },
                ]}
              />
            </View>
          )}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.pearl, borderColor: colors.mist }]}>
            <Text variant="caption" style={[styles.statLabel, { color: colors.stone }]}>spent</Text>
            <Text variant="title" style={[styles.statValue, { color: colors.ink }]}>{fmt(totalSpent)}</Text>
          </View>
          {limit > 0 && (
            <View style={[styles.statCard, { backgroundColor: colors.pearl, borderColor: colors.mist }]}>
              <Text variant="caption" style={[styles.statLabel, { color: colors.stone }]}>remaining</Text>
              <Text
                variant="title"
                style={[styles.statValue, { color: colors.ink }, overBudget && styles.overBudgetText]}
              >
                {fmt(Math.abs(remaining))}
              </Text>
              {overBudget && (
                <Text variant="caption" style={styles.overLabel}>over budget</Text>
              )}
            </View>
          )}
          <View style={[styles.statCard, { backgroundColor: colors.pearl, borderColor: colors.mist }]}>
            <Text variant="caption" style={[styles.statLabel, { color: colors.stone }]}>items</Text>
            <Text variant="title" style={[styles.statValue, { color: colors.ink }]}>{entries.length}</Text>
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
                  <Text variant="caption" style={[styles.catName, { color: colors.ink }]}>{cat.label}</Text>
                  <Text variant="caption" style={[styles.catAmount, { color: colors.ink }]}>{fmt(cat.total)}</Text>
                </View>
                {limit > 0 && (
                  <View style={[styles.catBar, { backgroundColor: colors.mist }]}>
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
              <View style={[styles.emptyIcon, { backgroundColor: colors.taupe + "14" }]}>
                <Feather name="dollar-sign" size={24} color={colors.taupe} />
              </View>
              <Text variant="titleItalic" style={[styles.emptyText, { color: colors.stone }]}>
                no expenses yet
              </Text>
              <Text variant="caption" style={[styles.emptyHint, { color: colors.sand }]}>
                track flights, hotels, meals & more
              </Text>
            </View>
          )}
          <View style={entries.length > 0 ? [styles.entriesCard, { backgroundColor: colors.pearl, borderColor: colors.mist }] : undefined}>
            {entries.map((entry, idx) => {
              const cat = BUDGET_CATS.find((c) => c.key === entry.category) ?? BUDGET_CATS[6];
              return (
                <View
                  key={entry.id}
                  style={[
                    styles.entryRow,
                    idx < entries.length - 1 && [styles.entryBorder, { borderBottomColor: colors.mist }],
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => togglePaid(entry.id)}
                    style={[
                      styles.paidDot,
                      { borderColor: colors.sand },
                      entry.paid && { backgroundColor: cat.color, borderColor: cat.color },
                    ]}
                  >
                    {entry.paid && <Feather name="check" size={10} color={colors.ivory} />}
                  </TouchableOpacity>
                  <View style={styles.entryInfo}>
                    <Text
                      variant="body"
                      style={[styles.entryLabel, { color: colors.ink }, entry.paid && { textDecorationLine: "line-through", color: colors.stone, opacity: 0.6 }]}
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
                  <Text variant="body" style={[styles.entryAmount, { color: colors.ink }]}>{fmt(entry.amount)}</Text>
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
        style={[styles.addButton, { backgroundColor: colors.ink }]}
        onPress={() => setShowAdd(true)}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={16} color={colors.ivory} style={{ marginRight: 6 }} />
        <Text variant="body" style={[styles.addButtonText, { color: colors.ivory }]}>add expense</Text>
      </TouchableOpacity>

      {/* Add sheet */}
      {showAdd && (
        <Modal visible animationType="slide" transparent>
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setShowAdd(false)}
          >
            <TouchableOpacity style={[styles.sheet, { backgroundColor: colors.ivory }]} activeOpacity={1} onPress={() => {}}>
              <View style={[styles.handle, { backgroundColor: colors.mist }]} />
              <Text variant="title" style={styles.sheetTitle}>new expense</Text>

              <TextInput
                style={[styles.input, { borderColor: colors.sand, color: colors.ink, backgroundColor: colors.pearl }]}
                placeholder="what was it for?"
                placeholderTextColor={colors.sand}
                value={newLabel}
                onChangeText={setNewLabel}
                autoFocus
              />
              <View style={[styles.amountInputRow, { borderColor: colors.sand, backgroundColor: colors.pearl }]}>
                <Text variant="body" style={[styles.amountDollar, { color: colors.taupe }]}>$</Text>
                <TextInput
                  style={[styles.amountInput, { color: colors.ink }]}
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
                      { borderColor: colors.sand, backgroundColor: colors.pearl },
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
                style={[styles.saveBtn, { backgroundColor: colors.ink }, (!newLabel.trim() || !newAmount) && styles.saveBtnDisabled]}
                onPress={addEntry}
                disabled={!newLabel.trim() || !newAmount}
                activeOpacity={0.8}
              >
                <Text variant="body" style={[styles.saveBtnText, { color: colors.ivory }]}>add expense</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.sand }]}
                onPress={() => setShowAdd(false)}
                activeOpacity={0.8}
              >
                <Text variant="body" style={[styles.cancelText, { color: colors.stone }]}>cancel</Text>
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
    marginBottom: spacing.md,
  },
  body: {
    flex: 1,
  },
  heroCard: {
    borderRadius: 14,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
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
  },
  heroInput: {
    fontSize: 36,
    fontFamily: "CormorantGaramond_700Bold",
    minWidth: 50,
    textAlign: "center",
    paddingVertical: 0,
  },
  heroBar: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    marginTop: 12,
    overflow: "hidden",
  },
  heroBarFill: {
    height: 4,
    borderRadius: 2,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: 10,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    gap: 2,
  },
  statLabel: {
    fontSize: 10,
  },
  statValue: {
    fontSize: 18,
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
    fontFamily: "Inter_500Medium",
  },
  catAmount: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  catBar: {
    height: 3,
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
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyText: {
  },
  emptyHint: {
  },
  entriesCard: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
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
  },
  paidDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  entryInfo: {
    flex: 1,
    gap: 2,
  },
  entryLabel: {
    fontSize: 14,
  },
  entryCatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  entryAmount: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
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
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    fontFamily: "Inter_500Medium",
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
    marginBottom: spacing.md,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    marginBottom: 12,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  amountDollar: {
    fontSize: 18,
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 18,
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
  },
  saveBtn: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  saveBtnDisabled: {
    opacity: 0.3,
  },
  saveBtnText: {
    fontFamily: "Inter_500Medium",
  },
  cancelBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: {
  },
});
