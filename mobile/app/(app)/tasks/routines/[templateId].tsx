import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../../../src/context/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteRoutineTemplate,
  fetchRoutineTemplateDetail,
  updateRoutineTemplate,
} from "../../../../src/services/api";
import { useI18n } from "../../../../src/context/I18nContext";

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DAY_LABELS: Record<string, string> = {
  SUN: "Sun",
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
};

export default function RoutineDetailScreen() {
  const router = useRouter();
  const { templateId } = useLocalSearchParams<{ templateId?: string }>();
  const { token } = useAuth();
  const { translations: t } = useI18n();
  const queryClient = useQueryClient();

  const detailQuery = useQuery({
    queryKey: ["routine-template", templateId, token],
    queryFn: () => fetchRoutineTemplateDetail(token!, templateId as string),
    enabled: !!token && typeof templateId === "string",
  });

const [form, setForm] = useState({
  name: "",
  description: "",
  days: DAYS,
});

  const [items, setItems] = useState<Array<{ title: string; points: string }>>([{ title: "", points: "1" }]);

  useEffect(() => {
    if (detailQuery.data) {
      setForm({
        name: detailQuery.data.name ?? "",
        description: detailQuery.data.description ?? "",
        days: detailQuery.data.daysOfWeek && detailQuery.data.daysOfWeek.length > 0 ? detailQuery.data.daysOfWeek : DAYS,
      });
      setItems(
        detailQuery.data.items.map((item) => ({
          title: item.title,
          points: String(item.points ?? 1),
        })),
      );
    }
  }, [detailQuery.data]);

  const invalidate = async () => {
    if (!templateId || !token) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["routine-template", templateId, token] }),
      queryClient.invalidateQueries({ queryKey: ["routine-templates", token] }),
      queryClient.invalidateQueries({ queryKey: ["tasks", token] }),
    ]);
  };

  const updateMutation = useMutation({
    mutationFn: () =>
      updateRoutineTemplate(token!, templateId as string, {
        name: form.name.trim(),
        description: form.description || undefined,
        daysOfWeek: form.days,
        items: items.map((item) => ({
          title: item.title || "Task",
          points: Number(item.points) || 1,
        })),
      }),
    onSuccess: async () => {
      await invalidate();
      Alert.alert(t.tasks.routineUpdatedTitle, t.tasks.routineUpdatedMessage);
    },
    onError: (error: Error) => {
      Alert.alert(t.tasks.templateSaveError, error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRoutineTemplate(token!, templateId as string),
    onSuccess: async () => {
      await invalidate();
      router.replace("/tasks");
    },
    onError: (error: Error) => {
      Alert.alert(t.tasks.deleteRoutineError, error.message);
    },
  });

  const handleDelete = () => {
    Alert.alert(t.tasks.deleteRoutineConfirmTitle, t.tasks.deleteRoutineConfirmMessage, [
      { text: t.tasks.back, style: "cancel" },
      { text: t.tasks.deleteRoutine, style: "destructive", onPress: () => deleteMutation.mutate() },
    ]);
  };

  const assignments = detailQuery.data?.assignments ?? [];

  if (!token || !templateId) {
    return null;
  }

  if (detailQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6c63ff" />
        </View>
      </SafeAreaView>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{t.tasks.loadRoutineError}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backLabel}>← {t.tasks.back}</Text>
          </TouchableOpacity>
          <Text style={styles.header}>{t.tasks.createRoutine}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>{t.tasks.routineNameLabel}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.tasks.routineNamePlaceholder}
            value={form.name}
            onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
            placeholderTextColor="#94a3b8"
          />
          <Text style={styles.label}>{t.tasks.descriptionLabel}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.tasks.routineDescriptionPlaceholder}
            value={form.description}
            onChangeText={(value) => setForm((prev) => ({ ...prev, description: value }))}
            placeholderTextColor="#94a3b8"
          />
          <Text style={styles.label}>{t.tasks.daysActiveLabel}</Text>
          <View style={styles.dayRow}>
            {DAYS.map((day) => (
              <TouchableOpacity
                key={day}
                style={[styles.dayChip, form.days.includes(day) && styles.dayChipActive]}
                onPress={() =>
                  setForm((prev) => {
                    const selected = prev.days.includes(day)
                      ? prev.days.filter((d) => d !== day)
                      : [...prev.days, day];
                    return { ...prev, days: selected };
                  })
                }
              >
                <Text style={form.days.includes(day) ? styles.dayTextActive : styles.dayText}>
                  {t.tasks.dayLabels?.[day] ?? day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {items.length} {t.tasks.routineTasksLabel}
          </Text>
          {items.map((item, index) => (
            <View key={`routine-item-${index}`} style={styles.itemRow}>
              <TextInput
                style={[styles.input, styles.flexOne]}
                placeholder={`Task ${index + 1}`}
                value={item.title}
                onChangeText={(value) =>
                  setItems((prev) => {
                    const next = [...prev];
                    next[index] = { ...next[index], title: value };
                    return next;
                  })
                }
                placeholderTextColor="#94a3b8"
              />
              <TextInput
                style={[styles.input, styles.pointsInput]}
                placeholder="Pts"
                value={item.points}
                keyboardType="numeric"
                onChangeText={(value) =>
                  setItems((prev) => {
                    const next = [...prev];
                    next[index] = { ...next[index], points: value };
                    return next;
                  })
                }
                placeholderTextColor="#94a3b8"
              />
              {items.length > 1 && (
                <TouchableOpacity
                  style={styles.removeItemButton}
                  onPress={() => setItems((prev) => prev.filter((_, idx) => idx !== index))}
                >
                  <Text style={styles.removeItemText}>{t.tasks.removeTask}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity
            onPress={() => setItems((prev) => [...prev, { title: "", points: "1" }])}
          >
            <Text style={styles.addLink}>{t.tasks.addRoutineTask}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.tasks.currentlyAssigned}</Text>
          {assignments.length === 0 ? (
            <Text style={styles.lightText}>{t.tasks.noAssigned}</Text>
          ) : (
            assignments.map((assignment) => (
              <View key={assignment.childId} style={styles.assignmentTag}>
                <Text style={styles.assignmentName}>{assignment.childName}</Text>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, updateMutation.isPending && styles.disabledButton]}
          onPress={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
        >
          <Text style={styles.primaryButtonText}>
            {updateMutation.isPending ? t.tasks.saving : t.tasks.saveRoutine}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, deleteMutation.isPending && styles.disabledButton]}
          onPress={handleDelete}
          disabled={deleteMutation.isPending}
        >
          <Text style={styles.deleteButtonText}>
            {deleteMutation.isPending ? t.tasks.deleteRoutineLoading : t.tasks.deleteRoutine}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f5f3ff",
  },
  container: {
    padding: 20,
    gap: 16,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#dc2626",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2933",
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
  section: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  label: {
    color: "#4b5563",
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
  dayRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dayChip: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dayChipActive: {
    backgroundColor: "#ede9fe",
    borderColor: "#c4b5fd",
  },
  dayText: {
    color: "#475569",
  },
  dayTextActive: {
    color: "#4c1d95",
    fontWeight: "600",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  flexOne: {
    flex: 1,
  },
  pointsInput: {
    width: 80,
  },
  removeItemButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  removeItemText: {
    color: "#ef4444",
    fontWeight: "600",
  },
  addLink: {
    color: "#6c63ff",
    fontWeight: "600",
  },
  assignmentRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 12,
    marginBottom: 12,
  },
  assignmentTag: {
    backgroundColor: "#eef2ff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  assignmentName: {
    color: "#4338ca",
    fontWeight: "600",
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
  toneChipText: {
    color: "#475569",
  },
  toneChipTextActive: {
    color: "#4c1d95",
    fontWeight: "600",
  },
  toneDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  primaryButton: {
    backgroundColor: "#6c63ff",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#dc2626",
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.6,
  },
  lightText: {
    color: "#94a3b8",
  },
});
