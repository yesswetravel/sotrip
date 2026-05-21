import { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Share,
  Platform,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Container, Text } from "../../../features/design-system";
import { useSession } from "../../../lib/use-session";
import { useTrip } from "../../../features/trips/hooks";
import { useTripMembers } from "../../../features/couple/hooks";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";

const TRIP_CODE_KEY = (tripId: string) => `@trip:${tripId}:invite_code`;

function generateTripCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `TRP-${code}`;
}

export default function TripInviteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useSession();
  const { data: trip } = useTrip(id);
  const {
    members,
    pendingInvites,
    addMember,
    removeMember,
    cancelInvite,
  } = useTripMembers(id);

  const [tripCode, setTripCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [showAddDemo, setShowAddDemo] = useState(false);
  const [friendName, setFriendName] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      let code = await AsyncStorage.getItem(TRIP_CODE_KEY(id));
      if (!code) {
        code = generateTripCode();
        await AsyncStorage.setItem(TRIP_CODE_KEY(id), code);
      }
      setTripCode(code);
    })();
  }, [id]);

  const tripName = trip?.title ?? "our trip";
  const shareMessage = `join my trip "${tripName}"! use code: ${tripCode}`;

  async function handleCopyCode() {
    await Clipboard.setStringAsync(tripCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShareLink() {
    try {
      await Share.share({ message: shareMessage });
    } catch {}
  }

  async function handleShareMessage() {
    try {
      await Share.share({ message: shareMessage });
    } catch {}
  }

  async function handleShareEmail() {
    try {
      await Share.share({
        message: shareMessage,
        ...(Platform.OS === "ios" ? { subject: `join ${tripName}` } : {}),
      });
    } catch {}
  }

  async function handleAddDemo() {
    if (!friendName.trim()) return;
    await addMember(friendName.trim());
    setFriendName("");
    setShowAddDemo(false);
  }

  const totalPeople = 1 + members.length + pendingInvites.length;

  return (
    <Container>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text variant="eyebrow">invite friends</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >
        {/* Trip context */}
        <View style={styles.tripContext}>
          <Feather name="map" size={16} color={colors.gold} />
          <Text variant="body" style={styles.tripName}>{tripName}</Text>
        </View>

        {/* Trip code box */}
        <View style={styles.codeBox}>
          <Text variant="eyebrow" style={styles.codeEyebrow}>trip code</Text>
          <Text style={styles.codeText}>{tripCode}</Text>
          <Text variant="caption" style={styles.codeSub}>
            share this code — they can join from the app
          </Text>
        </View>

        {/* Copy button */}
        <TouchableOpacity
          style={styles.copyBtn}
          onPress={handleCopyCode}
          activeOpacity={0.85}
        >
          <Feather
            name={copied ? "check" : "clipboard"}
            size={14}
            color={colors.pearl}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.copyBtnText}>
            {copied ? "copied!" : "copy code"}
          </Text>
        </TouchableOpacity>

        {/* Divider: or share via */}
        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or share via</Text>
          <View style={styles.orLine} />
        </View>

        {/* Share methods */}
        <TouchableOpacity style={styles.shareMethod} onPress={handleShareLink} activeOpacity={0.7}>
          <View style={[styles.shareIcon, { backgroundColor: colors.teal + "14" }]}>
            <Feather name="link" size={16} color={colors.teal} />
          </View>
          <View style={styles.shareBody}>
            <Text style={styles.shareName}>share link</Text>
            <Text style={styles.shareDesc}>anyone with the link can join</Text>
          </View>
          <Feather name="chevron-right" size={14} color={colors.sand} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareMethod} onPress={handleShareMessage} activeOpacity={0.7}>
          <View style={[styles.shareIcon, { backgroundColor: colors.coral + "14" }]}>
            <Feather name="message-circle" size={16} color={colors.coral} />
          </View>
          <View style={styles.shareBody}>
            <Text style={styles.shareName}>send via message</Text>
            <Text style={styles.shareDesc}>text, whatsapp, telegram</Text>
          </View>
          <Feather name="chevron-right" size={14} color={colors.sand} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareMethod} onPress={handleShareEmail} activeOpacity={0.7}>
          <View style={[styles.shareIcon, { backgroundColor: colors.gold + "14" }]}>
            <Feather name="mail" size={16} color={colors.gold} />
          </View>
          <View style={styles.shareBody}>
            <Text style={styles.shareName}>send via email</Text>
            <Text style={styles.shareDesc}>send a styled invite email</Text>
          </View>
          <Feather name="chevron-right" size={14} color={colors.sand} />
        </TouchableOpacity>

        {/* Who's going */}
        <Text variant="eyebrow" style={styles.sectionLabel}>
          who's going · {totalPeople}
        </Text>

        {/* Owner */}
        <View style={styles.memberCard}>
          <View style={[styles.memberAvatar, { backgroundColor: colors.coral }]}>
            <Text style={styles.memberLetter}>P</Text>
          </View>
          <View style={styles.memberBody}>
            <Text style={styles.memberName}>you</Text>
            <Text style={styles.memberRole}>organiser</Text>
          </View>
          <View style={styles.ownerBadge}>
            <Feather name="star" size={10} color={colors.gold} />
          </View>
        </View>

        {/* Members */}
        {members.map((m) => (
          <View key={m.id} style={styles.memberCard}>
            <View style={[styles.memberAvatar, { backgroundColor: m.avatar_color }]}>
              <Text style={styles.memberLetter}>
                {m.display_name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.memberBody}>
              <Text style={styles.memberName}>{m.display_name.toLowerCase()}</Text>
              <Text style={styles.memberRole}>{m.role}</Text>
            </View>
            <TouchableOpacity
              onPress={() => removeMember(m.id)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={14} color={colors.sand} />
            </TouchableOpacity>
          </View>
        ))}

        {/* Pending */}
        {pendingInvites.map((inv) => (
          <View key={inv.id} style={[styles.memberCard, styles.pendingCard]}>
            <View style={[styles.memberAvatar, styles.pendingAvatar]}>
              <Feather name="clock" size={14} color={colors.stone} />
            </View>
            <View style={styles.memberBody}>
              <Text style={styles.memberName}>
                {inv.invitee_email ?? inv.invitee_name ?? "someone"}
              </Text>
              <View style={styles.pendingRow}>
                <View style={styles.pendingDot} />
                <Text style={styles.memberRole}>pending</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => cancelInvite(inv.id)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={14} color={colors.sand} />
            </TouchableOpacity>
          </View>
        ))}

        {/* Quick add (demo) */}
        {!showAddDemo ? (
          <TouchableOpacity
            style={styles.addFriendBtn}
            onPress={() => setShowAddDemo(true)}
            activeOpacity={0.7}
          >
            <View style={styles.addFriendIcon}>
              <Feather name="user-plus" size={14} color={colors.teal} />
            </View>
            <Text style={styles.addFriendText}>add friend directly</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.demoSection}>
            <View style={styles.inputCard}>
              <Feather name="user" size={16} color={colors.stone} />
              <TextInput
                style={styles.input}
                placeholder="friend's name (e.g. Leo)"
                placeholderTextColor={colors.sand}
                value={friendName}
                onChangeText={setFriendName}
                autoFocus
              />
            </View>
            <View style={styles.demoBtnRow}>
              <TouchableOpacity
                style={[styles.tealBtn, !friendName.trim() && styles.btnDisabled]}
                onPress={handleAddDemo}
                activeOpacity={0.85}
                disabled={!friendName.trim()}
              >
                <Feather name="user-plus" size={14} color={colors.pearl} style={{ marginRight: 8 }} />
                <Text style={styles.tealBtnText}>add to trip</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setShowAddDemo(false); setFriendName(""); }}
                activeOpacity={0.7}
              >
                <Text variant="caption" style={{ color: colors.stone }}>cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Permissions card */}
        <View style={styles.permCard}>
          <Text style={styles.permTitle}>what travel mates can see</Text>
          {[
            { icon: "check" as const, color: colors.teal, text: "calendar & itinerary" },
            { icon: "check" as const, color: colors.teal, text: "saved places & map" },
            { icon: "check" as const, color: colors.teal, text: "shared photos" },
            { icon: "x" as const, color: colors.coral, text: "packing list (private)" },
            { icon: "x" as const, color: colors.coral, text: "budget (private)" },
            { icon: "x" as const, color: colors.coral, text: "documents (private)" },
            { icon: "x" as const, color: colors.coral, text: "notes (private)" },
            { icon: "x" as const, color: colors.coral, text: "outfits (private)" },
          ].map((p, i) => (
            <View key={i} style={styles.permRow}>
              <Feather name={p.icon} size={12} color={p.color} />
              <Text style={styles.permText}>{p.text}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: spacing.xxl * 2 }} />
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.md,
    paddingBottom: 14,
  },
  scroll: {
    paddingTop: spacing.sm,
  },

  /* Trip context */
  tripContext: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: spacing.lg,
  },
  tripName: {
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 18,
    color: colors.ink,
  },

  /* Code box */
  codeBox: {
    backgroundColor: colors.pearl,
    borderWidth: 1.5,
    borderColor: colors.sand,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: spacing.md,
    alignItems: "center",
    marginBottom: 12,
  },
  codeEyebrow: {
    fontSize: 9,
    color: colors.stone,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  codeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 28,
    letterSpacing: 4,
    color: colors.ink,
    marginVertical: 8,
  },
  codeSub: {
    fontSize: 11,
    color: colors.stone,
  },

  /* Copy button */
  copyBtn: {
    flexDirection: "row",
    backgroundColor: colors.coral,
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  copyBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: colors.pearl,
  },

  /* Divider */
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: spacing.md,
  },
  orLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.mist,
  },
  orText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    color: colors.sand,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  /* Share methods */
  shareMethod: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.pearl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  shareIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  shareBody: {
    flex: 1,
    gap: 1,
  },
  shareName: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: colors.ink,
  },
  shareDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    color: colors.stone,
  },

  /* Section label */
  sectionLabel: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },

  /* Member cards */
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.pearl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  pendingCard: {
    opacity: 0.7,
    borderStyle: "dashed",
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pendingAvatar: {
    backgroundColor: colors.sand + "30",
  },
  memberLetter: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: colors.pearl,
  },
  memberBody: {
    flex: 1,
    gap: 2,
  },
  memberName: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: colors.ink,
  },
  memberRole: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: colors.stone,
  },
  ownerBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gold + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  pendingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
  },

  /* Add friend */
  addFriendBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
    borderRadius: 12,
    padding: 14,
    borderStyle: "dashed",
  },
  addFriendIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.teal + "14",
    alignItems: "center",
    justifyContent: "center",
  },
  addFriendText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: colors.teal,
  },

  /* Demo */
  demoSection: {
    gap: spacing.sm,
  },
  inputCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.pearl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.ink,
  },
  demoBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tealBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.teal,
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  tealBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: colors.pearl,
  },
  btnDisabled: {
    opacity: 0.4,
  },

  /* Permissions */
  permCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.gold + "0D",
    borderWidth: 1,
    borderColor: colors.gold + "25",
    borderRadius: 14,
    padding: spacing.md,
  },
  permTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: colors.ink,
    marginBottom: 10,
  },
  permRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  permText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: colors.stone,
  },
});
