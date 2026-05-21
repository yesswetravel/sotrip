import { StyleSheet, View, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Container, Text } from "../features/design-system";
import { useSession } from "../lib/use-session";
import { useTrips } from "../features/trips/hooks";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

/**
 * If someone lands on /invite (old route), redirect them to pick a trip
 * then go to that trip's invite screen.
 */
export default function InviteRedirectScreen() {
  const router = useRouter();
  const { session } = useSession();
  const { data: trips } = useTrips(session?.user.id);

  const tripList = trips ?? [];

  return (
    <Container>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text variant="eyebrow">invite friends</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text variant="display" style={styles.title}>
          which trip?
        </Text>
        <Text variant="caption" style={styles.subtitle}>
          choose a trip to invite friends to
        </Text>

        <View style={styles.tripList}>
          {tripList.map((trip) => (
            <TouchableOpacity
              key={trip.id}
              style={styles.tripCard}
              onPress={() => router.replace(`/trip/${trip.id}/invite`)}
              activeOpacity={0.7}
            >
              <View style={styles.tripIcon}>
                <Feather name="map" size={16} color={colors.gold} />
              </View>
              <View style={styles.tripBody}>
                <Text variant="body" style={styles.tripTitle}>{trip.title}</Text>
                {trip.destination && (
                  <Text variant="caption" style={styles.tripDest}>{trip.destination}</Text>
                )}
              </View>
              <Feather name="chevron-right" size={16} color={colors.sand} />
            </TouchableOpacity>
          ))}
        </View>

        {tripList.length === 0 && (
          <View style={styles.empty}>
            <Text variant="caption" style={styles.emptyText}>
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
    paddingTop: spacing.md,
    paddingBottom: 14,
  },
  scroll: {
    paddingTop: spacing.md,
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    color: colors.stone,
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
    backgroundColor: colors.pearl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
    borderRadius: 12,
    padding: 14,
  },
  tripIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gold + "14",
    alignItems: "center",
    justifyContent: "center",
  },
  tripBody: {
    flex: 1,
    gap: 2,
  },
  tripTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  tripDest: {
    fontSize: 11,
    color: colors.stone,
  },
  empty: {
    alignItems: "center",
    paddingTop: spacing.xxl,
  },
  emptyText: {
    color: colors.stone,
  },
});
