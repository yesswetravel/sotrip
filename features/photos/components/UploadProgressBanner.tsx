import { StyleSheet, View, Animated } from "react-native";
import { useEffect, useRef } from "react";
import { Text } from "../../design-system";
import { colors } from "../../../theme/colors";
import type { PhotoUploadJob } from "../../../types/photos";

interface Props {
  jobs: PhotoUploadJob[];
}

export default function UploadProgressBanner({ jobs }: Props) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  const total = jobs.length;
  const done = jobs.filter((j) => j.status === "done").length;
  const errors = jobs.filter((j) => j.status === "error").length;
  const progress = total > 0 ? (done + errors) / total : 0;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  if (total === 0) return null;

  const allFinished = done + errors === total;
  const label = allFinished
    ? errors > 0
      ? `${done} uploaded, ${errors} failed`
      : `${done} photo${done === 1 ? "" : "s"} added`
    : `uploading ${done}/${total}…`;

  return (
    <View style={styles.container}>
      <Text variant="caption" style={styles.label}>
        {label}
      </Text>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: widthAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            },
            errors > 0 && allFinished && styles.fillError,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.pearl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.mist,
  },
  label: {
    marginBottom: 6,
    color: colors.stone,
  },
  track: {
    height: 3,
    backgroundColor: colors.mist,
    borderRadius: 2,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: colors.ink,
    borderRadius: 2,
  },
  fillError: {
    backgroundColor: "#C44",
  },
});
