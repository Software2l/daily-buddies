import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../../src/context/AuthContext";
import { updateProfile } from "../../src/services/api";
import { useI18n } from "../../src/context/I18nContext";
import { COMMON_TIMEZONES } from "../../src/constants/timezones";

const TONE_COLORS: Record<string, string> = {
  sunrise: "#fb923c",
  forest: "#22c55e",
  ocean: "#38bdf8",
  lavender: "#c084fc",
  sunset: "#f87171",
};

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, token, refreshProfile, logout } = useAuth();
  const { translations: t, language, setLanguage } = useI18n();
  const insets = useSafeAreaInsets();
  const resolvedTimezone =
    typeof Intl !== "undefined" && Intl.DateTimeFormat().resolvedOptions
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC";
  const timezoneInputRef = useRef<TextInput | null>(null);

  const [name, setName] = useState(profile?.name ?? "");
  const [avatarTone, setAvatarTone] = useState(profile?.avatarTone ?? "sunrise");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [familyTimezone, setFamilyTimezone] = useState(profile?.family?.timezone ?? resolvedTimezone);
  const [timezoneQuery, setTimezoneQuery] = useState("");
  const [showTimezoneSuggestions, setShowTimezoneSuggestions] = useState(false);
  const [lastCommittedTimezone, setLastCommittedTimezone] = useState(
    profile?.family?.timezone ?? resolvedTimezone,
  );

  useEffect(() => {
    setName(profile?.name ?? "");
    setAvatarTone(profile?.avatarTone ?? "");
    setFamilyTimezone(profile?.family?.timezone ?? resolvedTimezone);
    setLastCommittedTimezone(profile?.family?.timezone ?? resolvedTimezone);
    setTimezoneQuery("");
  }, [profile?.name, profile?.avatarTone, profile?.family?.timezone, resolvedTimezone]);

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateProfile>[1]) =>
      updateProfile(token!, payload),
    onSuccess: async () => {
      await refreshProfile();
      Alert.alert(t.profile.alertUpdatedTitle, t.profile.alertUpdatedMessage);
    },
    onError: (error: Error) => {
      Alert.alert(t.profile.alertSaveErrorTitle, error.message);
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(t.profile.alertNameRequiredTitle, t.profile.alertNameRequiredMessage);
      return;
    }

    mutation.mutate({
      name: name.trim(),
      avatarTone: avatarTone || null,
      currentPassword: currentPassword || undefined,
      newPassword: newPassword || undefined,
      familyTimezone: profile?.role === "PARENT" ? familyTimezone?.trim() || undefined : undefined,
    });

    setCurrentPassword("");
    setNewPassword("");
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            setShowTimezoneSuggestions(false);
            timezoneInputRef.current?.blur();
            Keyboard.dismiss();
          }}
        >
          <ScrollView
            contentContainerStyle={[styles.container, { paddingBottom: 48 + insets.bottom }]}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerRow}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backLabel}>← {t.profile.back}</Text>
              </TouchableOpacity>
              <Text style={styles.header}>{t.profile.title}</Text>
              <LanguageToggle current={language} onSelect={setLanguage} />
            </View>

            <Text style={styles.subtitle}>{t.profile.subtitle}</Text>

            <View style={styles.card}>
              {profile?.username ? (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>{t.profile.usernameLabel}</Text>
                  <Text style={styles.infoValue}>{profile.username}</Text>
                </View>
              ) : null}
              <Input label={t.profile.displayNameLabel} value={name} onChangeText={setName} />
              <TonePicker
                value={avatarTone}
                onChange={setAvatarTone}
                toneLabels={t.profile.toneLabels}
              />
              {profile?.role === "PARENT" ? (
                <View style={styles.field}>
                  <Text style={styles.label}>{t.profile.familyTimezoneLabel}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={resolvedTimezone}
                    value={timezoneQuery || familyTimezone}
                    ref={timezoneInputRef}
                    onFocus={() => setShowTimezoneSuggestions(true)}
                    onChangeText={(value) => {
                      setTimezoneQuery(value);
                      setFamilyTimezone(value);
                      setShowTimezoneSuggestions(true);
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onBlur={() => setShowTimezoneSuggestions(false)}
                  />
                  {showTimezoneSuggestions ? (
                    <View style={styles.suggestionBox}>
                      <TouchableOpacity
                        style={styles.suggestionClose}
                        onPress={() => {
                          setFamilyTimezone(lastCommittedTimezone);
                          setTimezoneQuery("");
                          setShowTimezoneSuggestions(false);
                          timezoneInputRef.current?.blur();
                          Keyboard.dismiss();
                        }}
                      >
                        <Text style={styles.suggestionCloseText}>✕</Text>
                      </TouchableOpacity>
                      {(timezoneQuery
                        ? COMMON_TIMEZONES.filter((tz) => {
                            const q = timezoneQuery.toLowerCase().trim();
                            return (
                              tz.name.toLowerCase().includes(q) || tz.offset.toLowerCase().includes(q)
                            );
                          })
                        : COMMON_TIMEZONES)
                        .slice(0, 8)
                        .map((tz) => (
                          <TouchableOpacity
                            key={tz.name}
                            style={styles.suggestionRow}
                            onPress={() => {
                              setFamilyTimezone(tz.name);
                              setTimezoneQuery(tz.name);
                              setLastCommittedTimezone(tz.name);
                              setShowTimezoneSuggestions(false);
                            }}
                          >
                            <Text style={styles.suggestionText}>
                              {tz.name} ({tz.offset})
                            </Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                  ) : null}
                </View>
              ) : null}
              <Input
                label={t.profile.currentPasswordLabel}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder={t.profile.currentPasswordPlaceholder}
              />
              <Input
                label={t.profile.newPasswordLabel}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              <TouchableOpacity
                style={[styles.primaryButton, mutation.isPending && styles.disabled]}
                onPress={handleSave}
                disabled={mutation.isPending}
              >
                <Text style={styles.primaryText}>
                  {mutation.isPending ? t.profile.saving : t.profile.save}
                </Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>{t.profile.logout}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const Input = ({
  label,
  secureTextEntry,
  ...rest
}: {
  label: string;
  secureTextEntry?: boolean;
  [key: string]: unknown;
}) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      placeholderTextColor="#94a3b8"
      autoCapitalize="none"
      secureTextEntry={secureTextEntry}
      {...rest}
    />
  </View>
);

const TonePicker = ({
  value,
  onChange,
  toneLabels,
}: {
  value: string;
  onChange: (tone: string) => void;
  toneLabels: Record<string, string>;
}) => (
  <View style={styles.toneRow}>
    {Object.keys(TONE_COLORS).map((tone) => (
      <TouchableOpacity
        key={tone}
        style={[styles.toneChip, value === tone && styles.toneChipActive]}
        onPress={() => onChange(tone)}
      >
        <View style={[styles.toneDot, { backgroundColor: TONE_COLORS[tone] }]} />
        <Text style={value === tone ? styles.toneTextActive : styles.toneText}>
          {toneLabels[tone] ?? tone}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

const LanguageToggle = ({
  current,
  onSelect,
}: {
  current: "en" | "mm";
  onSelect: (language: "en" | "mm") => Promise<void>;
}) => (
  <View style={styles.languageToggle}>
    {(["en", "mm"] as const).map((lang) => (
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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f5f3ff",
  },
  flex: {
    flex: 1,
  },
  container: {
    padding: 20,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2933",
  },
  subtitle: {
    color: "#6b7280",
  },
  languageToggle: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    overflow: "hidden",
    marginLeft: "auto",
  },
  languageOption: {
    paddingHorizontal: 12,
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
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  backLabel: {
    color: "#4b5563",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
  },
  field: {
    gap: 6,
  },
  infoRow: {
    gap: 4,
  },
  infoValue: {
    fontWeight: "600",
    color: "#1f2933",
  },
  label: {
    color: "#475569",
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#f8fafc",
  },
  primaryButton: {
    backgroundColor: "#6c63ff",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  primaryText: {
    color: "#fff",
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.6,
  },
  toneRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  toneChip: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  toneChipActive: {
    backgroundColor: "#ede9fe",
    borderColor: "#c4b5fd",
  },
  toneText: {
    color: "#475569",
  },
  toneTextActive: {
    color: "#4c1d95",
    fontWeight: "600",
  },
  toneDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginTop: 4,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 4,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#dc2626",
    fontWeight: "700",
  },
  suggestionBox: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    backgroundColor: "#fff",
    overflow: "hidden",
    position: "relative",
    zIndex: 3,
    elevation: 3,
    paddingTop: 4,
  },
  suggestionRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  suggestionText: {
    color: "#1f2937",
  },
  suggestionClose: {
    position: "absolute",
    top: 4,
    right: 4,
    zIndex: 4,
    padding: 6,
  },
  suggestionCloseText: {
    fontWeight: "700",
    color: "#475569",
  },
});
