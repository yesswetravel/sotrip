import { useMemo, useRef, useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  type ViewToken,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { Text } from "../../../features/design-system";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";

const { width: SW, height: SH } = Dimensions.get("window");
const PAGE_H = SH - 120;
const FREE_PAGES = 5;

/* ------------------------------------------------------------------ */
/*  Sample photos                                                      */
/* ------------------------------------------------------------------ */

const P = {
  eiffel: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
  cafe: "https://images.unsplash.com/photo-1549144511-f099e773c147?w=800&q=80",
  seine: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80",
  street: "https://images.unsplash.com/photo-1478391679764-b2d8b3cd1e94?w=800&q=80",
  croissant: "https://images.unsplash.com/photo-1520939817895-060bdaf4fe1b?w=800&q=80",
  wide: "https://images.unsplash.com/photo-1431274172761-fca41d930114?w=800&q=80",
  louvre: "https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=800&q=80",
  hotel: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
  sunset: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
  wine: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80",
  market: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
  arch: "https://images.unsplash.com/photo-1509439581779-6298f75bf6e5?w=800&q=80",
};

/* ------------------------------------------------------------------ */
/*  Page components                                                    */
/* ------------------------------------------------------------------ */

function CoverPage() {
  return (
    <View style={[s.page]}>
      <Image source={{ uri: P.eiffel }} style={s.fullBg} contentFit="cover" transition={400} />
      <View style={[s.fullBg, s.coverOverlay]}>
        <View style={s.coverTop}>
          <Text style={s.coverEyebrow}>A  M E M O R Y  B O O K</Text>
        </View>
        <View style={s.coverCenter}>
          <Text style={s.coverCity}>paris</Text>
          <View style={s.coverLine} />
          <Text style={s.coverYear}>2025</Text>
        </View>
        <View style={s.coverBottom}>
          <Text style={s.coverNames}>piggie & leo</Text>
          <Text style={s.coverDates}>june 2 — june 7, 2025</Text>
          <Text style={s.coverDays}>five days, two of us</Text>
        </View>
      </View>
    </View>
  );
}

function MoodPage() {
  return (
    <View style={[s.page, s.centerPage]}>
      <Text style={s.moodQuote}>
        "the golden hour lasted{"\n"}all week — every corner{"\n"}turned into a painting{"\n"}we didn't want to leave"
      </Text>
      <View style={s.moodDivider} />
      <Text style={s.moodAttrib}>— from your moments together</Text>
    </View>
  );
}

function DayDividerPage({ dayNum, dayName, subtitle }: { dayNum: string; dayName: string; subtitle: string }) {
  return (
    <View style={[s.page, s.centerPage]}>
      <Text style={s.dividerEyebrow}>DAY</Text>
      <Text style={s.dividerNum}>{dayNum}</Text>
      <Text style={s.dividerName}>{dayName}</Text>
      <View style={s.dividerLine} />
      <Text style={s.dividerSub}>{subtitle}</Text>
    </View>
  );
}

function FullBleedPage({ uri, caption }: { uri: string; caption?: string }) {
  return (
    <View style={s.page}>
      <Image source={{ uri }} style={s.fullBg} contentFit="cover" transition={300} />
      {caption && (
        <View style={s.fullCaptionWrap}>
          <Text style={s.fullCaption}>{caption}</Text>
        </View>
      )}
    </View>
  );
}

function PhotoCaptionPage({ uri, caption, time }: { uri: string; caption: string; time?: string }) {
  return (
    <View style={[s.page, { backgroundColor: colors.ivory }]}>
      <View style={s.pcPhotoWrap}>
        <Image source={{ uri }} style={s.pcPhoto} contentFit="cover" transition={300} />
      </View>
      <View style={s.pcTextWrap}>
        {time && <Text style={s.pcTime}>{time}</Text>}
        <Text style={s.pcCaption}>{caption}</Text>
      </View>
    </View>
  );
}

function CollagePageA({ photos }: { photos: string[] }) {
  const gap = 4;
  const col = (SW - 48 - gap) / 2;
  return (
    <View style={[s.page, { backgroundColor: colors.ivory, paddingTop: 40, paddingHorizontal: 24 }]}>
      <Text style={s.collageTitleText}>the moments</Text>
      <View style={{ flexDirection: "row", gap, marginTop: 16 }}>
        <View style={{ width: col, gap }}>
          <Image source={{ uri: photos[0] }} style={{ width: col, height: col * 1.4, borderRadius: 8 }} contentFit="cover" />
          <Image source={{ uri: photos[2] }} style={{ width: col, height: col * 0.75, borderRadius: 8 }} contentFit="cover" />
        </View>
        <View style={{ width: col, gap, marginTop: 30 }}>
          <Image source={{ uri: photos[1] }} style={{ width: col, height: col * 0.75, borderRadius: 8 }} contentFit="cover" />
          <Image source={{ uri: photos[3] }} style={{ width: col, height: col * 1.4, borderRadius: 8 }} contentFit="cover" />
        </View>
      </View>
    </View>
  );
}

function CollagePageB({ photos }: { photos: string[] }) {
  const pad = 24;
  const w = SW - pad * 2;
  const gap = 4;
  const third = (w - gap * 2) / 3;
  return (
    <View style={[s.page, { backgroundColor: colors.ivory, paddingHorizontal: pad, paddingTop: 40 }]}>
      <Image source={{ uri: photos[0] }} style={{ width: w, height: w * 0.6, borderRadius: 10 }} contentFit="cover" />
      <View style={{ flexDirection: "row", gap, marginTop: gap }}>
        {photos.slice(1, 4).map((uri, i) => (
          <Image key={i} source={{ uri }} style={{ width: third, height: third, borderRadius: 8 }} contentFit="cover" />
        ))}
      </View>
    </View>
  );
}

function QuotePage({ quote, photo }: { quote: string; photo: string }) {
  return (
    <View style={s.page}>
      <Image source={{ uri: photo }} style={s.fullBg} contentFit="cover" transition={400} />
      <View style={[s.fullBg, s.quoteOverlay]}>
        <Feather name="edit-3" size={16} color={colors.coral} style={{ marginBottom: 14 }} />
        <Text style={s.quoteText}>"{quote}"</Text>
        <Text style={s.quoteAttrib}>— from your notes</Text>
      </View>
    </View>
  );
}

function StoryPage({ title, body }: { title: string; body: string }) {
  return (
    <View style={[s.page, s.centerPage, { paddingHorizontal: 32 }]}>
      <Feather name="feather" size={20} color={colors.coral} style={{ marginBottom: 16 }} />
      <Text style={s.storyTitle}>{title}</Text>
      <View style={s.storyDivider} />
      <Text style={s.storyBody}>{body}</Text>
      <Text style={s.storyAttrib}>— from your notes</Text>
    </View>
  );
}

function RememberPage({ items }: { items: string[] }) {
  return (
    <View style={[s.page, s.centerPage, { paddingHorizontal: 36 }]}>
      <Text style={s.rememberEyebrow}>THINGS TO REMEMBER</Text>
      <View style={s.rememberList}>
        {items.map((item, i) => (
          <View key={i} style={s.rememberRow}>
            <Text style={s.rememberBullet}>·</Text>
            <Text style={s.rememberText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function StatsPage() {
  return (
    <View style={[s.page, s.centerPage]}>
      <Text style={s.statsEyebrow}>IN NUMBERS</Text>
      <View style={s.statsRow}>
        <View style={s.statBlock}>
          <Text style={s.statNum}>12</Text>
          <Text style={s.statLabel}>PLACES</Text>
        </View>
        <View style={s.statBlock}>
          <Text style={s.statNum}>5</Text>
          <Text style={s.statLabel}>DAYS</Text>
        </View>
        <View style={s.statBlock}>
          <Text style={s.statNum}>247</Text>
          <Text style={s.statLabel}>PHOTOS</Text>
        </View>
      </View>
      <Text style={s.statsClosing}>...and countless little moments</Text>
    </View>
  );
}

function PlacesPage() {
  const places = [
    "café de flore", "le marais", "louvre museum", "sacré-cœur",
    "pont alexandre III", "shakespeare & company", "musée d'orsay",
    "tuileries garden", "le comptoir", "montmartre", "seine river cruise",
    "galeries lafayette",
  ];
  return (
    <View style={[s.page, { backgroundColor: colors.ivory, paddingTop: 40, paddingHorizontal: 32 }]}>
      <Text style={s.placesEyebrow}>PLACES WE WENT</Text>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginTop: 16 }}>
        {places.map((p, i) => (
          <View key={i} style={s.placeRow}>
            <Text style={s.placeIdx}>{String(i + 1).padStart(2, "0")}</Text>
            <Text style={s.placeName}>{p}</Text>
          </View>
        ))}
        <Text style={s.placeClosing}>...and the memories between</Text>
      </ScrollView>
    </View>
  );
}

function ClosingPage() {
  return (
    <View style={s.page}>
      <Image source={{ uri: P.sunset }} style={s.fullBg} contentFit="cover" transition={400} />
      <View style={[s.fullBg, s.closingOverlay]}>
        <Text style={s.closingText}>the slow ones,{"\n"}kept.</Text>
        <View style={s.closingLine} />
        <Text style={s.closingDate}>paris · june 2025</Text>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Locked page overlay                                                */
/* ------------------------------------------------------------------ */

function LockedOverlay({ onUnlock }: { onUnlock: () => void }) {
  return (
    <TouchableOpacity
      style={s.lockedOverlay}
      activeOpacity={0.95}
      onPress={onUnlock}
    >
      <View style={s.lockedBlur}>
        <View style={s.lockedIconWrap}>
          <Feather name="lock" size={24} color={colors.coral} />
        </View>
        <Text style={s.lockedTitle}>this page is locked</Text>
        <Text style={s.lockedSub}>unlock the full book to see all pages</Text>
        <View style={s.lockedUnlockBtn}>
          <Feather name="star" size={12} color={colors.pearl} />
          <Text style={s.lockedUnlockText}>unlock book</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ------------------------------------------------------------------ */
/*  Page dots                                                          */
/* ------------------------------------------------------------------ */

function PageDots({ count, active, freeCount }: { count: number; active: number; freeCount: number }) {
  return (
    <View style={s.dotsRow}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            s.dot,
            i === active ? s.dotActive : s.dotInactive,
            i >= freeCount && i !== active ? s.dotLocked : null,
          ]}
        />
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export default function MemoryBookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activePage, setActivePage] = useState(0);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(`memory_unlocked_${id}`).then((val) => {
      if (val === "true") setUnlocked(true);
    });
  }, [id]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActivePage(viewableItems[0].index);
      }
    },
  ).current;
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const pages = [
    { key: "cover", render: () => <CoverPage /> },
    { key: "mood", render: () => <MoodPage /> },
    { key: "day1-div", render: () => <DayDividerPage dayNum="01" dayName="monday, june 2" subtitle="arrival day — the city was waiting" /> },
    { key: "day1-hero", render: () => <FullBleedPage uri={P.street} caption="first steps in le marais" /> },
    { key: "day1-pc", render: () => (
      <PhotoCaptionPage
        uri={P.croissant}
        time="9:32 am"
        caption="the first croissant — still warm, flaking into the napkin. you said it was the best thing you'd ever tasted. you say that every trip."
      />
    )},
    { key: "day1-collage", render: () => <CollagePageA photos={[P.cafe, P.street, P.croissant, P.seine]} /> },
    { key: "day2-div", render: () => <DayDividerPage dayNum="02" dayName="tuesday, june 3" subtitle="the day we got lost — and found everything" /> },
    { key: "day2-story", render: () => (
      <StoryPage
        title="the bookshop with the cat"
        body={"we didn't plan to find it. a wrong turn down rue de la bûcherie, past a man selling watercolours from a cart, and there it was — shakespeare & company, with a ginger cat sleeping in the window between two stacks of hemingway.\n\nyou stayed for an hour. i stayed for the cat.\n\nwe left with three books we didn't need and a photo of the cat that became your lock screen for the rest of the trip."}
      />
    )},
    { key: "day2-hero", render: () => <FullBleedPage uri={P.seine} /> },
    { key: "day2-collage", render: () => <CollagePageB photos={[P.louvre, P.arch, P.market, P.hotel]} /> },
    { key: "quote1", render: () => (
      <QuotePage
        quote="the olives at the market were the best we'd ever had — we went back twice"
        photo={P.market}
      />
    )},
    { key: "day3-div", render: () => <DayDividerPage dayNum="03" dayName="wednesday, june 4" subtitle="museum day — slow and unhurried" /> },
    { key: "day3-hero", render: () => <FullBleedPage uri={P.louvre} caption="inside the glass pyramid, looking up" /> },
    { key: "day3-pc", render: () => (
      <PhotoCaptionPage
        uri={P.wine}
        time="8:47 pm"
        caption="dinner at le comptoir — the waiter remembered us from last year. he brought the same wine without asking."
      />
    )},
    { key: "remember", render: () => (
      <RememberPage items={[
        "the sound of the accordion player on pont neuf at sunset",
        "how the hotel room smelled like lavender and old wood",
        "the tiny gallery where the artist gave you a sketch for free",
        "running through the rain near tuileries, laughing",
        "the way the light came through the window on our last morning",
        "that we promised to come back — and meant it",
      ]} />
    )},
    { key: "stats", render: () => <StatsPage /> },
    { key: "places", render: () => <PlacesPage /> },
    { key: "closing", render: () => <ClosingPage /> },
  ];

  const totalLocked = pages.length - FREE_PAGES;
  const isCurrentLocked = !unlocked && activePage >= FREE_PAGES;

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Feather name="x" size={18} color={colors.stone} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>
          {activePage + 1} / {pages.length}
        </Text>
        <TouchableOpacity hitSlop={12}>
          <Feather name="share" size={18} color={colors.stone} />
        </TouchableOpacity>
      </View>

      <PageDots count={pages.length} active={activePage} freeCount={unlocked ? pages.length : FREE_PAGES} />

      {/* Swipeable pages */}
      <FlatList
        data={pages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        renderItem={({ item, index }) => (
          <View style={{ width: SW }}>
            {item.render()}
            {!unlocked && index >= FREE_PAGES && (
              <LockedOverlay onUnlock={() => router.push(`/trip/${id}/memory-order`)} />
            )}
          </View>
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
      />

      {/* Unlock banner — shown on locked pages */}
      {!unlocked && activePage >= FREE_PAGES - 1 && (
        <View style={s.unlockBanner}>
          <View style={s.unlockInfo}>
            <Text style={s.unlockTitle}>
              {totalLocked} more pages waiting
            </Text>
            <Text style={s.unlockSub}>
              stories, photos & moments from your whole trip
            </Text>
          </View>
          <TouchableOpacity
            style={s.unlockBtn}
            activeOpacity={0.85}
            onPress={() => router.push(`/trip/${id}/memory-order`)}
          >
            <Text style={s.unlockBtnText}>unlock book</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Order print — shown when unlocked on last page */}
      {unlocked && activePage === pages.length - 1 && (
        <View style={s.unlockBanner}>
          <View style={s.unlockInfo}>
            <Text style={s.unlockTitle}>want a printed copy?</Text>
            <Text style={s.unlockSub}>soft-touch linen cover · ships in 5–7 days</Text>
          </View>
          <TouchableOpacity
            style={s.unlockBtn}
            activeOpacity={0.85}
            onPress={() => router.push(`/trip/${id}/memory-order?type=print`)}
          >
            <Text style={s.unlockBtnText}>order print</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ivory },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: spacing.lg, paddingTop: 52, paddingBottom: 6,
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.pearl, alignItems: "center", justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Inter_500Medium", fontSize: 12, color: colors.stone, letterSpacing: 1,
  },

  dotsRow: {
    flexDirection: "row", justifyContent: "center", alignItems: "center",
    gap: 4, paddingVertical: 6,
  },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  dotActive: { backgroundColor: colors.coral, width: 16, borderRadius: 3 },
  dotInactive: { backgroundColor: colors.mist },
  dotLocked: { backgroundColor: colors.sand, opacity: 0.4 },

  page: { width: SW, height: PAGE_H, overflow: "hidden" },
  centerPage: { justifyContent: "center", alignItems: "center", backgroundColor: colors.ivory },
  fullBg: { ...StyleSheet.absoluteFillObject },

  /* Locked overlay */
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(236,230,214,0.92)",
    justifyContent: "center", alignItems: "center",
  },
  lockedBlur: { alignItems: "center", gap: 10 },
  lockedIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.coral + "12",
    alignItems: "center", justifyContent: "center", marginBottom: 6,
  },
  lockedTitle: {
    fontFamily: "CormorantGaramond_500Medium_Italic", fontSize: 22, color: colors.ink,
  },
  lockedSub: {
    fontFamily: "Inter_400Regular", fontSize: 12, color: colors.stone, textAlign: "center",
  },
  lockedUnlockBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: colors.coral, borderRadius: 999,
    paddingVertical: 12, paddingHorizontal: 24, marginTop: 18,
  },
  lockedUnlockText: {
    fontFamily: "Inter_500Medium", fontSize: 13, color: colors.pearl,
  },

  /* Unlock banner */
  unlockBanner: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.pearl, borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.mist,
    paddingHorizontal: spacing.lg, paddingVertical: 14, paddingBottom: 30,
    gap: 12,
  },
  unlockInfo: { flex: 1, gap: 2 },
  unlockTitle: {
    fontFamily: "Inter_500Medium", fontSize: 14, color: colors.ink,
  },
  unlockSub: {
    fontFamily: "Inter_400Regular", fontSize: 11, color: colors.stone,
  },
  unlockBtn: {
    backgroundColor: colors.coral, borderRadius: 999,
    paddingVertical: 12, paddingHorizontal: 22,
  },
  unlockBtnText: {
    fontFamily: "Inter_500Medium", fontSize: 13, color: colors.pearl,
  },

  /* Cover */
  coverOverlay: {
    backgroundColor: "rgba(30,42,58,0.38)",
    justifyContent: "space-between", paddingTop: 50, paddingBottom: 50, paddingHorizontal: 32,
  },
  coverTop: { alignItems: "center" },
  coverEyebrow: {
    fontFamily: "Inter_500Medium", fontSize: 9, letterSpacing: 4, color: "rgba(255,255,255,0.6)",
  },
  coverCenter: { alignItems: "center" },
  coverCity: {
    fontFamily: "CormorantGaramond_500Medium_Italic", fontSize: 64, lineHeight: 68,
    color: "#fff", textAlign: "center",
  },
  coverLine: { width: 40, height: 2, backgroundColor: colors.coral, marginVertical: 14 },
  coverYear: {
    fontFamily: "Inter_500Medium", fontSize: 14, letterSpacing: 6, color: "rgba(255,255,255,0.7)",
  },
  coverBottom: { alignItems: "center", gap: 4 },
  coverNames: { fontFamily: "CormorantGaramond_500Medium", fontSize: 18, color: "rgba(255,255,255,0.9)" },
  coverDates: { fontFamily: "Inter_400Regular", fontSize: 11, color: "rgba(255,255,255,0.6)" },
  coverDays: { fontFamily: "Inter_400Regular", fontSize: 10, color: "rgba(255,255,255,0.4)" },

  /* Mood */
  moodQuote: {
    fontFamily: "CormorantGaramond_500Medium_Italic", fontSize: 24, lineHeight: 34,
    color: colors.ink, textAlign: "center", paddingHorizontal: 32,
  },
  moodDivider: { width: 30, height: 1.5, backgroundColor: colors.coral, marginVertical: 20 },
  moodAttrib: {
    fontFamily: "Inter_400Regular", fontSize: 10, letterSpacing: 0.5,
    color: colors.stone, textAlign: "center",
  },

  /* Day divider */
  dividerEyebrow: {
    fontFamily: "Inter_500Medium", fontSize: 10, letterSpacing: 6, color: colors.stone, marginBottom: 4,
  },
  dividerNum: { fontFamily: "CormorantGaramond_500Medium", fontSize: 72, lineHeight: 78, color: colors.ink },
  dividerName: { fontFamily: "CormorantGaramond_500Medium_Italic", fontSize: 18, color: colors.stone, marginTop: 4 },
  dividerLine: { width: 24, height: 1.5, backgroundColor: colors.coral, marginVertical: 16 },
  dividerSub: {
    fontFamily: "CormorantGaramond_500Medium_Italic", fontSize: 15, color: colors.sand,
    textAlign: "center", paddingHorizontal: 40,
  },

  /* Full bleed */
  fullCaptionWrap: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingBottom: 28, paddingTop: 60,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  fullCaption: { fontFamily: "CormorantGaramond_500Medium_Italic", fontSize: 16, color: "rgba(255,255,255,0.85)" },

  /* Photo + caption */
  pcPhotoWrap: { flex: 1, margin: 24, marginBottom: 0, borderRadius: 12, overflow: "hidden" },
  pcPhoto: { width: "100%", height: "100%" },
  pcTextWrap: { paddingHorizontal: 28, paddingVertical: 20 },
  pcTime: {
    fontFamily: "Inter_500Medium", fontSize: 10, letterSpacing: 1,
    color: colors.coral, marginBottom: 6, textTransform: "uppercase",
  },
  pcCaption: { fontFamily: "CormorantGaramond_500Medium_Italic", fontSize: 17, lineHeight: 24, color: colors.ink },

  /* Collage */
  collageTitleText: {
    fontFamily: "Inter_500Medium", fontSize: 10, letterSpacing: 4,
    color: colors.stone, textTransform: "uppercase", textAlign: "center",
  },

  /* Quote */
  quoteOverlay: {
    backgroundColor: "rgba(30,42,58,0.55)",
    justifyContent: "center", alignItems: "center", paddingHorizontal: 36,
  },
  quoteText: {
    fontFamily: "CormorantGaramond_500Medium_Italic", fontSize: 22, lineHeight: 32,
    color: "#fff", textAlign: "center", marginBottom: 14,
  },
  quoteAttrib: { fontFamily: "Inter_400Regular", fontSize: 10, letterSpacing: 0.5, color: "rgba(255,255,255,0.5)" },

  /* Story */
  storyTitle: {
    fontFamily: "CormorantGaramond_500Medium_Italic", fontSize: 26, lineHeight: 30,
    color: colors.ink, textAlign: "center", marginBottom: 4,
  },
  storyDivider: { width: 24, height: 1.5, backgroundColor: colors.coral, marginVertical: 16 },
  storyBody: {
    fontFamily: "CormorantGaramond_500Medium", fontSize: 16, lineHeight: 24,
    color: colors.ink, textAlign: "center",
  },
  storyAttrib: {
    fontFamily: "Inter_400Regular", fontSize: 10, letterSpacing: 0.5, color: colors.coral, marginTop: 20,
  },

  /* Remember */
  rememberEyebrow: {
    fontFamily: "Inter_500Medium", fontSize: 10, letterSpacing: 4, color: colors.stone, marginBottom: 24,
  },
  rememberList: { gap: 14, alignItems: "flex-start" },
  rememberRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  rememberBullet: { fontFamily: "CormorantGaramond_500Medium", fontSize: 22, color: colors.coral, lineHeight: 22 },
  rememberText: { fontFamily: "CormorantGaramond_500Medium_Italic", fontSize: 16, lineHeight: 22, color: colors.ink, flex: 1 },

  /* Stats */
  statsEyebrow: {
    fontFamily: "Inter_500Medium", fontSize: 10, letterSpacing: 4, color: colors.stone, marginBottom: 28,
  },
  statsRow: { flexDirection: "row", gap: 40, marginBottom: 24 },
  statBlock: { alignItems: "center" },
  statNum: { fontFamily: "CormorantGaramond_500Medium", fontSize: 52, lineHeight: 56, color: colors.ink },
  statLabel: { fontFamily: "Inter_500Medium", fontSize: 9, letterSpacing: 2, color: colors.stone, marginTop: 4 },
  statsClosing: { fontFamily: "CormorantGaramond_500Medium_Italic", fontSize: 15, color: colors.stone },

  /* Places */
  placesEyebrow: {
    fontFamily: "Inter_500Medium", fontSize: 10, letterSpacing: 4, color: colors.stone, textAlign: "center",
  },
  placeRow: { flexDirection: "row", alignItems: "baseline", paddingVertical: 6 },
  placeIdx: { fontFamily: "Inter_400Regular", fontSize: 11, color: colors.coral, width: 28 },
  placeName: { fontFamily: "CormorantGaramond_500Medium", fontSize: 18, lineHeight: 22, color: colors.ink, flex: 1 },
  placeClosing: {
    fontFamily: "CormorantGaramond_500Medium_Italic", fontSize: 15, color: colors.stone, marginTop: 14, paddingLeft: 28,
  },

  /* Closing */
  closingOverlay: { backgroundColor: "rgba(30,42,58,0.45)", justifyContent: "center", alignItems: "center" },
  closingText: {
    fontFamily: "CormorantGaramond_500Medium_Italic", fontSize: 32, lineHeight: 40,
    color: "#fff", textAlign: "center",
  },
  closingLine: { width: 30, height: 1.5, backgroundColor: colors.coral, marginVertical: 18 },
  closingDate: { fontFamily: "Inter_400Regular", fontSize: 11, letterSpacing: 2, color: "rgba(255,255,255,0.6)" },
});
