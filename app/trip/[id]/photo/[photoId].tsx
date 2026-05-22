import { useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Text } from "../../../../features/design-system";
import { usePhotosByTrip, useUpdatePhoto, useDeletePhoto } from "../../../../features/photos/hooks";
import { useColors } from "../../../../features/theme/ThemeProvider";
import { spacing } from "../../../../theme/spacing";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export default function PhotoViewerScreen() {
  const colors = useColors();
  const { id, photoId } = useLocalSearchParams<{ id: string; photoId: string }>();
  const router = useRouter();
  const { data: photos } = usePhotosByTrip(id);
  const updatePhoto = useUpdatePhoto();
  const deletePhoto = useDeletePhoto();

  const photo = photos?.find((p) => p.id === photoId);
  const [caption, setCaption] = useState(photo?.caption ?? "");
  const [showControls, setShowControls] = useState(true);

  if (!photo) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.ink }]}>
        <ActivityIndicator color={colors.ivory} />
      </View>
    );
  }

  function handleSaveCaption() {
    if (caption.trim() === (photo?.caption ?? "")) return;
    updatePhoto.mutate({ photoId: photo!.id, patch: { caption: caption.trim() || null } });
  }

  function handleDelete() {
    Alert.alert("delete photo?", "this can't be undone", [
      { text: "cancel", style: "cancel" },
      {
        text: "delete",
        style: "destructive",
        onPress: () => {
          deletePhoto.mutate(
            { photoId: photo!.id, storagePath: photo!.storage_path },
            { onSuccess: () => router.back() }
          );
        },
      },
    ]);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.ink }]}>
      <TouchableOpacity
        style={styles.imageWrap}
        activeOpacity={1}
        onPress={() => setShowControls(!showControls)}
      >
        <Image
          source={{ uri: photo.display_url }}
          style={styles.image}
          contentFit="contain"
          transition={300}
        />
      </TouchableOpacity>

      {showControls && (
        <>
          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text variant="body" style={[styles.closeBtn, { color: colors.ivory }]}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete}>
              <Text variant="caption" style={styles.deleteLink}>delete</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom caption */}
          <View style={styles.bottomBar}>
            <TextInput
              style={[styles.captionInput, { color: colors.ivory }]}
              placeholder="add a caption…"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={caption}
              onChangeText={setCaption}
              onBlur={handleSaveCaption}
              returnKeyType="done"
              onSubmitEditing={handleSaveCaption}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  imageWrap: {
    flex: 1,
  },
  image: {
    width: SCREEN_W,
    height: SCREEN_H,
  },
  topBar: {
    position: "absolute",
    top: 60,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeBtn: {
    fontSize: 20,
  },
  deleteLink: {
    color: "rgba(255,255,255,0.7)",
  },
  bottomBar: {
    position: "absolute",
    bottom: 40,
    left: spacing.lg,
    right: spacing.lg,
  },
  captionInput: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "CormorantGaramond_500Medium_Italic",
    fontSize: 16,
  },
});
