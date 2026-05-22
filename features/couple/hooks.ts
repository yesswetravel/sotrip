import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { TripMember, TripInvite, InviteStatus } from "../../types/database";
import { useColors } from "../theme/ThemeProvider";

/* ------------------------------------------------------------------ */
/*  Storage helpers                                                    */
/* ------------------------------------------------------------------ */

const membersKey = (tripId: string) => `@trip:${tripId}:members`;
const invitesKey = (tripId: string) => `@trip:${tripId}:invites`;

/* ------------------------------------------------------------------ */
/*  Avatar colors — rotate through palette                             */
/* ------------------------------------------------------------------ */

function getAvatarColors(colors: ReturnType<typeof useColors>) {
  return [
    colors.coral,
    colors.teal,
    "#7B68C8", // lavender
    "#C86895", // rose
    "#68A8C8", // sky
    colors.gold,
  ];
}

function pickColor(index: number, avatarColors: string[]): string {
  return avatarColors[index % avatarColors.length];
}

/* ------------------------------------------------------------------ */
/*  Generate a short invite code                                       */
/* ------------------------------------------------------------------ */

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/* ------------------------------------------------------------------ */
/*  useTripMembers — manages members & invites per trip                */
/* ------------------------------------------------------------------ */

export function useTripMembers(tripId: string | undefined) {
  const colors = useColors();
  const avatarColors = getAvatarColors(colors);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [invites, setInvites] = useState<TripInvite[]>([]);
  const [loading, setLoading] = useState(true);

  // Load persisted state
  useEffect(() => {
    if (!tripId) return;
    (async () => {
      try {
        const [membersJson, invitesJson] = await Promise.all([
          AsyncStorage.getItem(membersKey(tripId)),
          AsyncStorage.getItem(invitesKey(tripId)),
        ]);
        if (membersJson) setMembers(JSON.parse(membersJson));
        if (invitesJson) setInvites(JSON.parse(invitesJson));
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [tripId]);

  // Persist helpers
  const saveMembers = async (updated: TripMember[]) => {
    if (!tripId) return;
    setMembers(updated);
    await AsyncStorage.setItem(membersKey(tripId), JSON.stringify(updated));
  };

  const saveInvites = async (updated: TripInvite[]) => {
    if (!tripId) return;
    setInvites(updated);
    await AsyncStorage.setItem(invitesKey(tripId), JSON.stringify(updated));
  };

  // Create a new invite for this trip
  const createInvite = useCallback(
    async (email: string, inviterId: string): Promise<TripInvite> => {
      const newInvite: TripInvite = {
        id: `inv_${Date.now()}`,
        trip_id: tripId ?? "",
        inviter_id: inviterId,
        invitee_email: email || null,
        invitee_name: null,
        invite_code: generateInviteCode(),
        status: "pending",
        created_at: new Date().toISOString(),
        accepted_at: null,
      };
      const updated = [...invites, newInvite];
      await saveInvites(updated);
      return newInvite;
    },
    [tripId, invites]
  );

  // Simulate someone accepting — adds them as a member
  const addMember = useCallback(
    async (name: string, email?: string): Promise<TripMember> => {
      const newMember: TripMember = {
        id: `mem_${Date.now()}`,
        trip_id: tripId ?? "",
        user_id: null,
        display_name: name,
        avatar_color: pickColor(members.length + 1, avatarColors), // +1 because owner is index 0
        email: email || null,
        role: "editor",
        joined_at: new Date().toISOString(),
      };
      const updatedMembers = [...members, newMember];
      await saveMembers(updatedMembers);

      // Mark matching invite as accepted
      const matchingIdx = invites.findIndex(
        (inv) =>
          inv.status === "pending" &&
          (inv.invitee_email === email || !inv.invitee_email)
      );
      if (matchingIdx >= 0) {
        const updatedInvites = [...invites];
        updatedInvites[matchingIdx] = {
          ...updatedInvites[matchingIdx],
          status: "accepted" as InviteStatus,
          invitee_name: name,
          accepted_at: new Date().toISOString(),
        };
        await saveInvites(updatedInvites);
      }

      return newMember;
    },
    [tripId, members, invites]
  );

  // Remove a member
  const removeMember = useCallback(
    async (memberId: string) => {
      const updated = members.filter((m) => m.id !== memberId);
      await saveMembers(updated);
    },
    [tripId, members]
  );

  // Cancel a pending invite
  const cancelInvite = useCallback(
    async (inviteId: string) => {
      const updated = invites.filter((i) => i.id !== inviteId);
      await saveInvites(updated);
    },
    [tripId, invites]
  );

  const pendingInvites = invites.filter((i) => i.status === "pending");

  return {
    members,
    invites,
    pendingInvites,
    loading,
    memberCount: members.length,
    createInvite,
    addMember,
    removeMember,
    cancelInvite,
  };
}
