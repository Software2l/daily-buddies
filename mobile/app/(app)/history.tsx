import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { fetchTaskHistory, TaskHistoryEntry, fetchFamilyMembers } from "../../src/services/api";
import { useState } from "react";
import { useI18n } from "../../src/context/I18nContext";

const toneColors: Record<string, string> = {
  sunrise: "#fb923c",
  forest: "#22c55e",
  ocean: "#38bdf8",
  lavender: "#c084fc",
  sunset: "#f87171",
  default: "#94a3b8",
};

const getToneColor = (tone?: string | null) => toneColors[tone ?? ""] ?? toneColors.default;

export default function HistoryScreen() {
  const router = useRouter();
  const { token, profile } = useAuth();
  const { translations: t } = useI18n();
  const [selectedChild, setSelectedChild] = useState<string | undefined>(undefined);

  const historyQuery = useQuery({
    queryKey: ["task-history", token, selectedChild],
    queryFn: () => fetchTaskHistory(token!, selectedChild),
    enabled: !!token,
  });

  const membersQuery = useQuery({
    queryKey: ["history-children", token],
    queryFn: () => fetchFamilyMembers(token!),
    enabled: profile?.role === "PARENT" && !!token,
  });

  if (!token) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backLabel}>← {t.history.back}</Text>
          </TouchableOpacity>
          <Text style={styles.header}>{t.history.title}</Text>
        </View>

        {profile?.role === "PARENT" && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterRow}
            contentContainerStyle={styles.filterRowContent}
          >
            <FilterChip
              label={t.history.filterAll}
              active={!selectedChild}
              onPress={() => setSelectedChild(undefined)}
            />
            {membersQuery.data
              ?.filter((member) => member.role === "CHILD")
              .map((child) => (
                <FilterChip
                  key={child.id}
                  label={child.name}
                  active={selectedChild === child.id}
                  onPress={() => setSelectedChild(child.id)}
                />
              ))}
          </ScrollView>
        )}

        {historyQuery.isLoading && (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#6c63ff" />
          </View>
        )}

        {historyQuery.data?.map((entry) => (
          <HistoryCard
            key={entry.id}
            entry={entry}
            isParent={profile?.role === "PARENT"}
            statusLabels={{
              completed: t.history.statusCompleted,
              pending: t.history.statusPending,
            }}
            seedsEarnedSuffix={t.history.seedsEarnedSuffix}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const HistoryCard = ({
  entry,
  isParent,
  statusLabels,
  seedsEarnedSuffix,
}: {
  entry: TaskHistoryEntry;
  isParent: boolean;
  statusLabels: { completed: string; pending: string };
  seedsEarnedSuffix: string;
}) => {
  const statusLabel =
    entry.status === "COMPLETED" ? statusLabels.completed : statusLabels.pending;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.taskTitle}>{entry.taskTitle}</Text>
        <View
          style={[
            styles.statusPill,
            entry.status === "COMPLETED" ? styles.statusPillCompleted : styles.statusPillPending,
          ]}
        >
          <Text style={styles.statusPillText}>{statusLabel}</Text>
        </View>
      </View>
      <Text style={styles.detailText}>{new Date(entry.date).toLocaleString()}</Text>
      {isParent ? (
        <View style={styles.childRow}>
          <View
            style={[
              styles.avatarDot,
              { backgroundColor: getToneColor(entry.childAvatarTone) },
            ]}
          />
          <Text style={styles.detailText}>{entry.childName}</Text>
        </View>
      ) : (
        <Text style={styles.detailText}>
          {entry.points ?? 0} {seedsEarnedSuffix}
        </Text>
      )}
    </View>
  );
};

const FilterChip = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <Pressable
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
    accessibilityRole="button"
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8f5ff",
  },
  container: {
    padding: 16,
    gap: 12,
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
    color: "#1f2933",
    marginBottom: 8,
  },
  loading: {
    padding: 40,
    alignItems: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    gap: 6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  statusText: {
    marginTop: 4,
    fontWeight: "600",
  },
  statusPending: {
    color: "#6366f1",
  },
  statusCompleted: {
    color: "#22c55e",
  },
  detailText: {
    color: "#6b7280",
  },
  filterRow: {
    flexGrow: 0,
    marginVertical: 8,
  },
  filterRowContent: {
    alignItems: "center",
  },
  chip: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: "#ede9fe",
    borderColor: "#c4b5fd",
  },
  chipText: {
    color: "#475569",
  },
  chipTextActive: {
    color: "#4c1d95",
    fontWeight: "600",
  },
  childRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillPending: {
    backgroundColor: "#eef2ff",
  },
  statusPillCompleted: {
    backgroundColor: "#dcfce7",
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#312e81",
    textTransform: "capitalize",
  },
});
