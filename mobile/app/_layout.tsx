import { Stack } from "expo-router";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../src/context/AuthContext";
import { NudgeSyncProvider } from "../src/context/NudgeSync";
import { I18nProvider } from "../src/context/I18nContext";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <>
      <StatusBar style="dark" backgroundColor="#ffffff" />
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <I18nProvider>
            <AuthProvider>
              <NudgeSyncProvider>
                <Stack
                  screenOptions={{
                    headerShown: false,
                  }}
                />
              </NudgeSyncProvider>
            </AuthProvider>
          </I18nProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </>
  );
}
