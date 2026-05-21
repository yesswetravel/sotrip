import { StyleSheet, View, TouchableOpacity, Dimensions } from "react-native";
import { Image } from "expo-image";
import { Text } from "../../design-system";
import { colors } from "../../../theme/colors";
import { spacing } from "../../../theme/spacing";
import type { Photo } from "../../../types/photos";

const GRID_GAP = 2;
const COLUMNS = 3;
const screenWidth = Dimensions.get("window").width;
const tileSize = (screenWidth - spacing.lg * 2 - GRID_GAP * (COLUMNS - 1)) / COLUMNS;

interface Props {
  photos: Photo[];
  onPhotoPress: (photo: Photo) => void;
  onAddPress: () => void;
}

export default function PhotoGrid({ photos, onPhotoPress, onAddPress }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text variant="eyebrow">photos</Text>
        <TouchableOpacity onPress={onAddPress} activeOpacity={0.7}>
          <Text variant="caption" style={styles.addLink}>+ add</Text>
        </TouchableOpacity>
      </View>

      {photos.length === 0 ? (
        <TouchableOpacity style={styles.empty} onPress={onAddPress} activeOpacity={0.8}>
          <Text variant="titleItalic" style={styles.emptyText}>
            tap to add photos
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.grid}>
          {photos.map((photo) => (
            <TouchableOpacity
              key={photo.id}
              onPress={() => onPhotoPress(photo)}
              activeOpacity={0.85}
            >
              <Image
                source={{ uri: photo.thumbnail_url }}
                style={styles.tile}
                contentFit="cover"
                transition={200}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  addLink: {
    color: colors.stone,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
  tile: {
    width: tileSize,
    height: tileSize,
    borderRadius: 4,
  },
  empty: {
    height: 100,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.mist,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.pearl,
  },
  emptyText: {
    color: colors.stone,
    fontSize: 15,
  },
});
