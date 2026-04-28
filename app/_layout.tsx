import { Stack } from "expo-router";

export default function RootLayout() {

  return (
    <Stack screenOptions={{ contentStyle: { backgroundColor: "#030303" } }}>
      <Stack.Screen
        name="index"
        options={{
          title: "Splash Screen",
          headerShown: false
        }}
      />

      <Stack.Screen
        name="onboarding/index"
        options={{
          title: "Onboarding",
          headerShown: false
        }}
      />

      <Stack.Screen
        name="authscreen/index"
        options={{
          title: "Auth Screen",
          headerShown: false
        }}
      />
      <Stack.Screen
        name="authscreen/login"
        options={{
          title: "Login Screen",
          headerShown: false
        }}
      />
      <Stack.Screen
        name="authscreen/signup"
        options={{
          title: "Sign Up Screen",
          headerShown: false
        }}
      />
      <Stack.Screen
        name="screen/index"
        options={{
          title: "Home Screen",
          headerShown: false
        }}
      />
      <Stack.Screen
        name="screen/details/[id]"
        options={{
          title: "Details Screen",
          headerShown: false
        }}
      />
      <Stack.Screen
        name="screen/details/details"
        options={{
          title: "Details Screen",
          headerShown: false
        }}
      />
      <Stack.Screen
        name="screen/users/[id]"
        options={{
          title: "User Profile",
          headerShown: false
        }}
      />
    </Stack>
  );
}
