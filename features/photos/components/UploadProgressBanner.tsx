import { StyleSheet, View, Animated } from "react-native";
import { useEffect, useRef } from "react";
import { Text } from "../../design-system";
import { useColors } from "../../theme/ThemeProvider";
import type { PhotoUploadJob } from "../../../types/photos";

interface Props {
  jobs: PhotoUploadJob[];
}

export default function UploadProgressBanner({ jobs }: Props) {
  const colors = useColors();
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
    <View style={[styles.container, { backgroundColor: colors.pearl, borderBottomColor: colors.mist }]}>
      <Text variant="caption" style={[styles.label, { color: colors.stone }]}>
        {label}
      </Text>
      <View style={[styles.track, { backgroundColor: colors.mist }]}>
        <Animated.View
          style={[
            styles.fill,
            { backgroundColor: colors.ink },
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: {
    marginBottom: 6,
  },
  track: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 2,
  },
  fillError: {
    backgroundColor: "#C44",
  },
});
