import { Link, useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
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

export default function RegisterScreen() {
  const router = useRouter();
  const { registerParent } = useAuth();
  const { translations: t, language, setLanguage } = useI18n();
  const insets = useSafeAreaInsets();
  const [familyName, setFamilyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!familyName || !name || !email || !username || !password) {
      Alert.alert(t.auth.register.missingInfoTitle, t.auth.register.missingInfoMessage);
      return;
    }

    try {
      setSubmitting(true);
      await registerParent({
        familyName: familyName.trim(),
        parent: {
          name: name.trim(),
          username: username.trim().toLowerCase(),
          email: email.trim().toLowerCase(),
          password,
        },
      });
      router.replace("/home");
    } catch (error) {
      Alert.alert(t.auth.register.signUpErrorTitle, (error as Error).message);
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
            <Text style={styles.title}>{t.auth.register.title}</Text>
            <Text style={styles.subtitle}>{t.auth.register.subtitle}</Text>

            <Field label={t.auth.register.familyNameLabel}>
              <TextInput
                style={styles.input}
                value={familyName}
                onChangeText={setFamilyName}
                placeholder={t.auth.register.familyNamePlaceholder}
              />
            </Field>

            <Field label={t.auth.register.yourNameLabel}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t.auth.register.yourNamePlaceholder}
              />
            </Field>

            <Field label={t.auth.register.emailLabel}>
              <TextInput
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                placeholder={t.auth.register.emailPlaceholder}
              />
            </Field>

            <Field label={t.auth.register.usernameLabel}>
              <TextInput
                style={styles.input}
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
                placeholder={t.auth.register.usernamePlaceholder}
              />
            </Field>

            <Field label={t.auth.register.passwordLabel}>
              <TextInput
                style={styles.input}
                autoCapitalize="none"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                placeholder={t.auth.register.passwordPlaceholder}
              />
            </Field>

            <TouchableOpacity
              onPress={handleRegister}
              disabled={submitting}
              style={[styles.button, submitting && styles.buttonDisabled]}
            >
              <Text style={styles.buttonText}>
                {submitting ? t.auth.register.creating : t.auth.register.create}
              </Text>
            </TouchableOpacity>

            <View style={styles.linkRow}>
              <Text style={styles.lightText}>{t.auth.register.haveAccount}</Text>
              <Link href="/login" style={styles.link}>
                {t.auth.register.signIn}
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safe: {
    flex: 1,
    backgroundColor: "#f0f4ff",
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
    shadowColor: "#1f2933",
    shadowOpacity: 0.05,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  title: {
    fontSize: 26,
    fontWeight: "600",
    color: "#1f2933",
  },
  subtitle: {
    color: "#6b7280",
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
    backgroundColor: "#2ec4b6",
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
    color: "#2ec4b6",
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
    backgroundColor: "#e0f2f1",
  },
  languageOptionText: {
    color: "#475569",
    fontWeight: "600",
  },
  languageOptionTextActive: {
    color: "#0f766e",
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
