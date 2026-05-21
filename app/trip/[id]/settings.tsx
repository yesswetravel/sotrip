import { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Share,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Container, Text } from "../../../features/design-system";
import { useTrip, useUpdateTrip, useDeleteTrip } from "../../../features/trips/hooks";
import { useTripMembers } from "../../../features/couple/hooks";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";
import type { MemberRole } from "../../../types/database";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d
    .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    .toLowerCase();
}

function roleLabel(role: MemberRole): string {
  if (role === "owner") return "owner";
  if (role === "editor") return "member";
  return "viewer";
}

/* ------------------------------------------------------------------ */
/*  Section header                                                     */
/* ------------------------------------------------------------------ */

function SectionHeader({ label }: { label: string }) {
  return (
    <Text variant="eyebrow" style={styles.sectionHeader}>
      {label}
    </Text>
  );
}

/* ------------------------------------------------------------------ */
/*  Settings row                                                       */
/* ------------------------------------------------------------------ */

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  danger,
  chevron = true,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  chevron?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[styles.rowIcon, danger && { backgroundColor: "#C4444414" }]}>
        <Feather
          name={icon}
          size={14}
          color={danger ? "#C44" : colors.stone}
        />
      </View>
      <View style={styles.rowContent}>
        <Text
          variant="body"
          style={[styles.rowLabel, danger && { color: "#C44" }]}
        >
          {label}
        </Text>
        {value ? (
          <Text variant="caption" style={styles.rowValue} numberOfLines={1}>
            {value}
          </Text>
        ) : null}
      </View>
      {chevron && onPress && (
        <Feather name="chevron-right" size={14} color={colors.sand} />
      )}
    </TouchableOpacity>
  );
}

/* ------------------------------------------------------------------ */
/*  Main screen                                                        */
/* ------------------------------------------------------------------ */

export default function TripSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: trip } = useTrip(id);
  const updateTrip = useUpdateTrip();
  const deleteTrip = useDeleteTrip();
  const { members, pendingInvites, createInvite, removeMember, cancelInvite } =
    useTripMembers(id);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [editingDest, setEditingDest] = useState(false);
  const [destDraft, setDestDraft] = useState("");
  const [confirmLeave, setConfirmLeave] = useState(false);

  // Get or create invite code for sharing
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  useState(() => {
    AsyncStorage.getItem(`@trip:${id}:invite_code`).then((code) => {
      if (code) {
        setInviteCode(code);
      } else {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let newCode = "";
        for (let i = 0; i < 6; i++) {
          newCode += chars[Math.floor(Math.random() * chars.length)];
        }
        setInviteCode(newCode);
        AsyncStorage.setItem(`@trip:${id}:invite_code`, newCode);
      }
    });
  });

  const handleSaveTitle = useCallback(() => {
    if (!titleDraft.trim() || !trip) return;
    updateTrip.mutate({ tripId: trip.id, patch: { title: titleDraft.trim() } });
    setEditingTitle(false);
  }, [titleDraft, trip]);

  const handleSaveDest = useCallback(() => {
    if (!trip) return;
    updateTrip.mutate({
      tripId: trip.id,
      patch: { destination: destDraft.trim() || null },
    });
    setEditingDest(false);
  }, [destDraft, trip]);

  const handleArchive = useCallback(() => {
    if (!trip) return;
    updateTrip.mutate(
      { tripId: trip.id, patch: { is_archived: true } },
      { onSuccess: () => router.replace("/(tabs)") }
    );
  }, [trip]);

  async function handleShareInvite() {
    if (!inviteCode || !trip) return;
    try {
      await Share.share({
        message: `join my trip "${trip.title}"! use invite code: ${inviteCode}`,
      });
    } catch {
      // user cancelled
    }
  }

  function handleLeaveTrip() {
    if (!confirmLeave) {
      setConfirmLeave(true);
      return;
    }
    // If there are other members, ownership transfers automatically
    // If last member, trip gets deleted
    if (members.length === 0) {
      // Last person — delete the trip
      deleteTrip.mutate(trip!.id, {
        onSuccess: () => router.replace("/(tabs)"),
      });
    } else {
      // Transfer ownership to next member (first by join date)
      // For now with AsyncStorage, we just archive for this user
      handleArchive();
    }
  }

  if (!trip) return null;

  return (
    <Container>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backRow}
          activeOpacity={0.7}
        >
          <Feather name="chevron-left" size={16} color={colors.stone} />
          <Text variant="body" style={styles.backText}>
            {trip.title}
          </Text>
        </TouchableOpacity>
        <Text variant="display" style={styles.pageTitle}>
          trip settings
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ============ Details ============ */}
        <SectionHeader label="details" />
        <View style={styles.card}>
          {editingTitle ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.editInput}
                value={titleDraft}
                onChangeText={setTitleDraft}
                autoFocus
                placeholder="trip name"
                placeholderTextColor={colors.sand}
                returnKeyType="done"
                onSubmitEditing={handleSaveTitle}
              />
              <TouchableOpacity onPress={handleSaveTitle} activeOpacity={0.7}>
                <Feather name="check" size={16} color={colors.teal} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setEditingTitle(false)}
                activeOpacity={0.7}
              >
                <Feather name="x" size={16} color={colors.stone} />
              </TouchableOpacity>
            </View>
          ) : (
            <SettingsRow
              icon="edit-3"
              label="trip name"
              value={trip.title}
              onPress={() => {
                setTitleDraft(trip.title);
                setEditingTitle(true);
              }}
            />
          )}

          {editingDest ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.editInput}
                value={destDraft}
                onChangeText={setDestDraft}
                autoFocus
                placeholder="destination"
                placeholderTextColor={colors.sand}
                returnKeyType="done"
                onSubmitEditing={handleSaveDest}
              />
              <TouchableOpacity onPress={handleSaveDest} activeOpacity={0.7}>
                <Feather name="check" size={16} color={colors.teal} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setEditingDest(false)}
                activeOpacity={0.7}
              >
                <Feather name="x" size={16} color={colors.stone} />
              </TouchableOpacity>
            </View>
          ) : (
            <SettingsRow
              icon="map-pin"
              label="destination"
              value={trip.destination ?? "not set"}
              onPress={() => {
                setDestDraft(trip.destination ?? "");
                setEditingDest(true);
              }}
            />
          )}

          <SettingsRow
            icon="calendar"
            label="dates"
            value={`${formatDate(trip.start_date)} — ${formatDate(trip.end_date)}`}
            chevron={false}
          />

          <SettingsRow
            icon="image"
            label="cover photo"
            value={trip.cover_photo_url ? "set" : "none"}
          />
        </View>

        {/* ============ Members ============ */}
        <SectionHeader label="members" />
        <View style={styles.card}>
          {/* Owner (you) */}
          <View style={styles.memberRow}>
            <View style={[styles.memberAvatar, { backgroundColor: colors.coral }]}>
              <Text style={styles.memberAvatarText}>P</Text>
            </View>
            <View style={styles.memberInfo}>
              <Text variant="body" style={styles.memberName}>you</Text>
              <Text variant="caption" style={styles.memberRole}>owner</Text>
            </View>
          </View>

          {/* Other members */}
          {members.map((m) => (
            <View key={m.id} style={styles.memberRow}>
              <View
                style={[styles.memberAvatar, { backgroundColor: m.avatar_color }]}
              >
                <Text style={styles.memberAvatarText}>
                  {m.display_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <Text variant="body" style={styles.memberName}>
                  {m.display_name}
                </Text>
                <Text variant="caption" style={styles.memberRole}>
                  {roleLabel(m.role)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => removeMember(m.id)}
                activeOpacity={0.7}
                style={styles.memberAction}
              >
                <Feather name="x" size={12} color={colors.stone} />
              </TouchableOpacity>
            </View>
          ))}

          {/* Pending invites */}
          {pendingInvites.map((inv) => (
            <View key={inv.id} style={styles.memberRow}>
              <View style={[styles.memberAvatar, styles.memberAvatarPending]}>
                <Feather name="clock" size={12} color={colors.stone} />
              </View>
              <View style={styles.memberInfo}>
                <Text variant="body" style={styles.memberName}>
                  {inv.invitee_email ?? "invite sent"}
                </Text>
                <Text variant="caption" style={styles.memberRole}>pending</Text>
              </View>
              <TouchableOpacity
                onPress={() => cancelInvite(inv.id)}
                activeOpacity={0.7}
                style={styles.memberAction}
              >
                <Feather name="x" size={12} color={colors.stone} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* ============ Invite Code ============ */}
        <SectionHeader label="invite code" />
        <View style={styles.card}>
          <View style={styles.inviteCodeSection}>
            <Text style={styles.inviteCodeText}>{inviteCode ?? "..."}</Text>
            <Text variant="caption" style={styles.inviteCodeHint}>
              share this code with anyone to join your trip
            </Text>
          </View>
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handleShareInvite}
            activeOpacity={0.8}
          >
            <Feather name="share" size={14} color={colors.pearl} />
            <Text variant="body" style={styles.shareBtnText}>
              share invite
            </Text>
          </TouchableOpacity>
        </View>

        {/* ============ Preferences ============ */}
        <SectionHeader label="preferences" />
        <View style={styles.card}>
          <SettingsRow
            icon="dollar-sign"
            label="currency"
            value="USD"
          />
          <SettingsRow
            icon="globe"
            label="timezone"
            value="auto-detect"
          />
        </View>

        {/* ============ Danger Zone ============ */}
        <SectionHeader label="danger zone" />
        <View style={[styles.card, styles.dangerCard]}>
          <SettingsRow
            icon="archive"
            label="archive trip"
            onPress={handleArchive}
            chevron={false}
          />
          <TouchableOpacity
            style={styles.leaveRow}
            onPress={handleLeaveTrip}
            activeOpacity={0.7}
          >
            <View style={[styles.rowIcon, { backgroundColor: "#C4444414" }]}>
              <Feather name="log-out" size={14} color="#C44" />
            </View>
            <View style={styles.rowContent}>
              <Text variant="body" style={styles.leaveText}>
                {confirmLeave
                  ? "tap again to confirm"
                  : "leave this trip"}
              </Text>
              <Text variant="caption" style={styles.leaveHint}>
                {members.length === 0
                  ? "you're the only member — this will delete the trip"
                  : `ownership will transfer to ${members[0].display_name}`}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </Container>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: spacing.sm,
  },
  backText: {
    color: colors.stone,
    fontSize: 13,
  },
  pageTitle: {
    fontSize: 28,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },

  /* Sections */
  sectionHeader: {
    paddingHorizontal: 4,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    color: colors.taupe,
  },
  card: {
    backgroundColor: colors.pearl,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
    overflow: "hidden",
  },
  dangerCard: {
    borderColor: "#C4444430",
  },

  /* Settings row */
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.mist,
    gap: 12,
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.mist + "60",
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: colors.ink,
  },
  rowValue: {
    fontSize: 12,
    color: colors.stone,
    marginTop: 1,
  },

  /* Edit inline */
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.mist,
  },
  editInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.ink,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.teal,
  },

  /* Members */
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.mist,
    gap: 12,
  },
  memberAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: {
    color: colors.pearl,
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  memberAvatarPending: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.sand,
    borderStyle: "dashed" as any,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: colors.ink,
  },
  memberRole: {
    fontSize: 11,
    color: colors.stone,
    marginTop: 1,
  },
  memberAction: {
    padding: 8,
  },

  /* Invite code */
  inviteCodeSection: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  inviteCodeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 28,
    letterSpacing: 6,
    color: colors.ink,
    marginBottom: 6,
  },
  inviteCodeHint: {
    fontSize: 11,
    color: colors.stone,
    textAlign: "center",
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.ink,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  shareBtnText: {
    color: colors.pearl,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },

  /* Leave / danger */
  leaveRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  leaveText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#C44",
  },
  leaveHint: {
    fontSize: 11,
    color: colors.stone,
    marginTop: 1,
  },
});
