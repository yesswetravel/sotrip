import { StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { colors } from "../../theme/colors";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.ivory,
          borderTopColor: colors.mist,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 80,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.stone,
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 9,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "trips",
          tabBarIcon: ({ color, size }) => (
            <Feather name="map" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="today"
        options={{
          title: "today",
          tabBarIcon: ({ color, size }) => (
            <Feather name="sun" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="photos"
        options={{
          title: "photos",
          tabBarIcon: ({ color, size }) => (
            <Feather name="camera" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="you-two"
        options={{
          title: "me",
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
