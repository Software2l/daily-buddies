import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { useI18n } from "../../src/context/I18nContext";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { translations: t, language, setLanguage } = useI18n();
  const insets = useSafeAreaInsets();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert(t.auth.login.missingInfoTitle, t.auth.login.missingInfoMessage);
      return;
    }

    try {
      setSubmitting(true);
      await login(identifier.trim(), password);
      router.replace("/home");
    } catch (error) {
      Alert.alert(t.auth.login.signInErrorTitle, (error as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[styles.container, { paddingBottom: 24 + insets.bottom }]}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.languageRow}>
            <LanguageToggle current={language} onSelect={setLanguage} />
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>{t.auth.login.title}</Text>
            <Text style={styles.subtitle}>{t.auth.login.subtitle}</Text>

            <View style={styles.field}>
              <Text style={styles.label}>{t.auth.login.identifierLabel}</Text>
              <TextInput
                style={styles.input}
                autoCapitalize="none"
                value={identifier}
                onChangeText={setIdentifier}
                placeholder={t.auth.login.identifierPlaceholder}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{t.auth.login.passwordLabel}</Text>
              <TextInput
                style={styles.input}
                autoCapitalize="none"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                placeholder={t.auth.login.passwordPlaceholder}
              />
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={submitting}
              style={[styles.button, submitting && styles.buttonDisabled]}
            >
              <Text style={styles.buttonText}>
                {submitting ? t.auth.login.signingIn : t.auth.login.signIn}
              </Text>
            </TouchableOpacity>

            <View style={styles.linkRow}>
              <Text style={styles.lightText}>{t.auth.login.needAccount}</Text>
              <Link href="/register" style={styles.link}>
                {t.auth.login.createOne}
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safe: {
    flex: 1,
    backgroundColor: "#f7f5ff",
  },
  container: {
    padding: 24,
    flexGrow: 1,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "#1f2933",
  },
  subtitle: {
    color: "#6b7280",
    fontSize: 14,
  },
  field: {
    gap: 6,
  },
  label: {
    color: "#374151",
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  button: {
    backgroundColor: "#6c63ff",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  lightText: {
    color: "#6b7280",
  },
  link: {
    color: "#6c63ff",
    fontWeight: "600",
  },
  languageRow: {
    alignSelf: "flex-end",
    marginBottom: 8,
  },
  languageToggle: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    overflow: "hidden",
  },
  languageOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  languageOptionActive: {
    backgroundColor: "#ede9fe",
  },
  languageOptionText: {
    color: "#475569",
    fontWeight: "600",
  },
  languageOptionTextActive: {
    color: "#4c1d95",
    fontWeight: "700",
  },
});

const LanguageToggle = ({
  current,
  onSelect,
}: {
  current: "en" | "mm";
  onSelect: (language: "en" | "mm") => Promise<void>;
}) => (
  <View style={styles.languageToggle}>
    {(["en", "mm"] as const).map(lang => (
      <TouchableOpacity
        key={lang}
        style={[styles.languageOption, current === lang && styles.languageOptionActive]}
        onPress={() => onSelect(lang)}
      >
        <Text style={current === lang ? styles.languageOptionTextActive : styles.languageOptionText}>
          {lang.toUpperCase()}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);
