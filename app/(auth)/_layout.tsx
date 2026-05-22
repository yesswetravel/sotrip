import { Stack } from "expo-router";
import { useColors } from "../../features/theme/ThemeProvider";

export default function AuthLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.ivory },
      }}
    />
  );
}
