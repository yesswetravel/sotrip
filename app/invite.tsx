import { StyleSheet, View, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Container, Text } from "../features/design-system";
import { goBack } from "../lib/go-back";
import { useSession } from "../lib/use-session";
import { useTrips } from "../features/trips/hooks";
import { useColors } from "../features/theme/ThemeProvider";
import { spacing } from "../theme/spacing";

/**
 * If someone lands on /invite (old route), redirect them to pick a trip
 * then go to that trip's invite screen.
 */
export default function InviteRedirectScreen() {
  const colors = useColors();
  const router = useRouter();
  const { session } = useSession();
  const { data: trips } = useTrips(session?.user.id);

  const tripList = trips ?? [];

  return (
    <Container logo>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBack(router)} activeOpacity={0.7}>
          <Feather name="chevron-left" size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text variant="eyebrow">invite friends</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text variant="display" style={styles.title}>
          which trip?
        </Text>
        <Text variant="caption" style={[styles.subtitle, { color: colors.stone }]}>
          choose a trip to invite friends to
        </Text>

        <View style={styles.tripList}>
          {tripList.map((trip) => (
            <TouchableOpacity
              key={trip.id}
              style={[styles.tripCard, { backgroundColor: colors.pearl, borderColor: colors.mist }]}
              onPress={() => router.replace(`/trip/${trip.id}/invite`)}
              activeOpacity={0.7}
            >
              <View style={[styles.tripIcon, { backgroundColor: colors.gold + "14" }]}>
                <Feather name="map" size={16} color={colors.gold} />
              </View>
              <View style={styles.tripBody}>
                <Text variant="body" style={styles.tripTitle}>{trip.title}</Text>
                {trip.destination && (
                  <Text variant="caption" style={[styles.tripDest, { color: colors.stone }]}>{trip.destination}</Text>
                )}
              </View>
              <Feather name="chevron-right" size={16} color={colors.sand} />
            </TouchableOpacity>
          ))}
        </View>

        {tripList.length === 0 && (
          <View style={styles.empty}>
            <Text variant="caption" style={[styles.emptyText, { color: colors.stone }]}>
              create a trip first, then invite friends
            </Text>
          </View>
        )}
      </ScrollView>
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
  scroll: {
    paddingTop: spacing.sm,
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  tripList: {
    gap: 8,
  },
  tripCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 14,
  },
  tripIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  tripBody: {
    flex: 1,
    gap: 2,
  },
  tripTitle: {
    fontFamily: "InstrumentSans_500Medium",
    fontSize: 14,
  },
  tripDest: {
    fontSize: 11,
  },
  empty: {
    alignItems: "center",
    paddingTop: spacing.xxl,
  },
  emptyText: {
  },
});
