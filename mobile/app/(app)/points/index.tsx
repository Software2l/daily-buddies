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
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../src/context/AuthContext";
import { useI18n } from "../../../src/context/I18nContext";
import {
  createPointEntry,
  fetchFamilyMembers,
  fetchPointEntries,
  PointEntry,
} from "../../../src/services/api";

const toneColors: Record<string, string> = {
  sunrise: "#fb923c",
  forest: "#22c55e",
  ocean: "#38bdf8",
  lavender: "#c084fc",
  sunset: "#f87171",
  default: "#94a3b8",
};

const getToneColor = (tone?: string | null) => toneColors[tone ?? ""] ?? toneColors.default;

type FormState = {
  childId: string;
  type: "GIFT" | "PENALTY";
  amount: string;
  note: string;
};

export default function PointsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token, profile } = useAuth();
  const { translations: t } = useI18n();
  const insets = useSafeAreaInsets();
  const isParent = profile?.role === "PARENT";

  const [form, setForm] = useState<FormState>({
    childId: "",
    type: "GIFT",
    amount: "",
    note: "",
  });

  const entriesQuery = useQuery({
    queryKey: ["points", token],
    queryFn: () => fetchPointEntries(token!, { scope: "today", limit: 25 }),
    enabled: !!token,
  });

  const childrenQuery = useQuery({
    queryKey: ["points-children", token],
    queryFn: () => fetchFamilyMembers(token!),
    enabled: isParent && !!token,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createPointEntry>[1]) => createPointEntry(token!, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["points", token] });
      setForm((prev) => ({ ...prev, amount: "", note: "" }));
      Alert.alert(
        t.points.alertSavedTitle,
        form.type === "GIFT" ? t.points.alertGiftMessage : t.points.alertPenaltyMessage,
      );
    },
    onError: (error: Error) => Alert.alert(t.points.alertUnableSaveTitle, error.message),
  });

  if (!token) {
    return null;
  }

  const entries = entriesQuery.data ?? [];
  const children = childrenQuery.data?.filter((member) => member.role === "CHILD") ?? [];

  const handleSubmit = async () => {
    if (!isParent) {
      return;
    }
    if (!form.childId) {
      Alert.alert(t.points.alertSelectChildTitle, t.points.alertSelectChildMessage);
      return;
    }
    const amount = Math.abs(Math.trunc(Number(form.amount)));
    if (!amount) {
      Alert.alert(t.points.alertAmountTitle, t.points.alertAmountMessage);
      return;
    }

    await saveMutation.mutateAsync({
      childId: form.childId,
      amount,
      type: form.type,
      note: form.note.trim() || undefined,
    });
  };

  const renderEntriesHeader = () => (
    <View style={styles.cardHeaderRow}>
      <Text style={styles.sectionTitle}>{t.points.today}</Text>
      {isParent ? (
        <TouchableOpacity style={styles.linkButton} onPress={() => router.push("/points/history")}>
          <Text style={styles.linkText}>{t.points.viewHistory}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: "padding", android: "height" })}
      >
        <ScrollView
          contentContainerStyle={[styles.container, { paddingBottom: 20 + insets.bottom }]}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backLabel}>← {t.family?.back ?? "Back"}</Text>
            </TouchableOpacity>
            <Text style={styles.header}>
              {isParent ? t.points.titleParent : t.points.titleChild}
            </Text>
          </View>
          <Text style={styles.subtitle}>
            {t.points.subtitle}
          </Text>

          <View style={styles.card}>
            {renderEntriesHeader()}
            {entries.length === 0 ? (
              <Text style={styles.lightText}>{t.points.emptyToday}</Text>
            ) : (
              entries.map((entry) => (
                <PointEntryRow
                  key={entry.id}
                  entry={entry}
                  isParent={isParent}
                  labels={{
                    gift: t.points.entryGiftLabel,
                    penalty: t.points.entryPenaltyLabel,
                  }}
                  seedsSuffix={t.points.seedsSuffix}
                />
              ))
            )}
          </View>

          {isParent ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t.points.newEntry}</Text>
              <Text style={styles.lightText}>{t.points.newEntryHint}</Text>

              <Text style={styles.fieldLabel}>{t.points.fieldChild}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {children.map((child) => {
                  const active = form.childId === child.id;
                  return (
                    <TouchableOpacity
                      key={child.id}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setForm((prev) => ({ ...prev, childId: child.id }))}
                    >
                      <View
                        style={[
                          styles.avatarDot,
                          { backgroundColor: getToneColor(child.avatarTone) },
                        ]}
                      />
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {child.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.toggleRow}>
                {(["GIFT", "PENALTY"] as const).map((type) => {
                  const active = form.type === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.toggle, active && styles.toggleActive]}
                      onPress={() => setForm((prev) => ({ ...prev, type }))}
                    >
                      <Text style={[styles.toggleLabel, active && styles.toggleLabelActive]}>
                        {type === "GIFT" ? t.points.typeGift : t.points.typePenalty}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>{t.points.fieldSeeds}</Text>
              <TextInput
                style={styles.input}
                value={form.amount}
                onChangeText={(value) => setForm((prev) => ({ ...prev, amount: value }))}
                keyboardType="number-pad"
                placeholder={t.points.amountPlaceholder}
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.fieldLabel}>{t.points.fieldNote}</Text>
              <TextInput
                style={[styles.input, styles.noteInput]}
                multiline
                value={form.note}
                onChangeText={(value) => setForm((prev) => ({ ...prev, note: value }))}
                placeholder={t.points.notePlaceholder}
                placeholderTextColor="#94a3b8"
              />

              <TouchableOpacity
                style={[styles.primaryButton, saveMutation.isPending && styles.primaryButtonDisabled]}
                disabled={saveMutation.isPending}
                onPress={handleSubmit}
              >
                <Text style={styles.primaryButtonLabel}>
                  {form.type === "GIFT" ? t.points.buttonGift : t.points.buttonPenalty}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const PointEntryRow = ({
  entry,
  isParent,
  labels,
  seedsSuffix,
}: {
  entry: PointEntry;
  isParent: boolean;
  labels: { gift: string; penalty: string };
  seedsSuffix: string;
}) => {
  const isGift = entry.points >= 0;
  const tone = entry.child?.avatarTone;
  return (
    <View style={styles.entryRow}>
      <View style={styles.entryIconWrapper}>
        <View
          style={[
            styles.entryIcon,
            { backgroundColor: isGift ? "#16a34a" : "#6366f1" },
          ]}
        >
          <Text style={styles.entryIconLabel}>{isGift ? "+" : "-"}</Text>
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.entryHeader}>
          <Text style={styles.entryTitle}>{isGift ? labels.gift : labels.penalty}</Text>
          <Text style={[styles.entryAmount, { color: isGift ? "#16a34a" : "#6366f1" }]}>
            {isGift ? "+" : "-"}
            {Math.abs(entry.points)} {seedsSuffix}
          </Text>
        </View>
        {entry.note ? <Text style={styles.entryNote}>{entry.note}</Text> : null}
        <Text style={styles.entryMeta}>
          {new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          {isParent && entry.child ? ` · ${entry.child.name}` : ""}
        </Text>
      </View>
      {entry.child && isParent ? (
        <View
          style={[
            styles.avatarDot,
            { backgroundColor: getToneColor(tone), marginLeft: 8 },
          ]}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8f5ff",
  },
  container: {
    padding: 16,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2937",
  },
  subtitle: {
    color: "#4b5563",
    fontSize: 14,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  lightText: {
    color: "#6b7280",
    fontSize: 14,
  },
  linkButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  linkText: {
    color: "#6366f1",
    fontWeight: "600",
  },
  entryRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e2e8f0",
  },
  entryIconWrapper: {
    justifyContent: "center",
  },
  entryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  entryIconLabel: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  entryTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },
  entryAmount: {
    fontWeight: "700",
  },
  entryNote: {
    color: "#4b5563",
    marginTop: 2,
  },
  entryMeta: {
    color: "#94a3b8",
    marginTop: 4,
    fontSize: 12,
  },
  avatarDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#cbd5f5",
  },
  chipRow: {
    gap: 10,
    paddingVertical: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    gap: 6,
  },
  chipActive: {
    backgroundColor: "#eef2ff",
    borderColor: "#818cf8",
  },
  chipText: {
    color: "#4b5563",
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#4338ca",
  },
  toggleRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  toggle: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  toggleActive: {
    backgroundColor: "#eef2ff",
    borderColor: "#6366f1",
  },
  toggleLabel: {
    fontWeight: "600",
    color: "#4b5563",
  },
  toggleLabelActive: {
    color: "#4338ca",
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#1f2937",
    marginTop: 6,
  },
  noteInput: {
    minHeight: 72,
    textAlignVertical: "top",
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: "#6366f1",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonLabel: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
