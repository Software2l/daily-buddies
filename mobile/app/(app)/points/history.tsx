import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../src/context/AuthContext";
import {
  fetchFamilyMembers,
  fetchPointEntries,
  fetchPointHistory,
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

export default function PointHistoryScreen() {
  const router = useRouter();
  const { token, profile } = useAuth();
  const isParent = profile?.role === "PARENT";
  const [selectedChild, setSelectedChild] = useState<string | undefined>();

  const historyQuery = useQuery({
    queryKey: ["points-history", token, selectedChild],
    queryFn: () =>
      isParent
        ? fetchPointHistory(token!, { childId: selectedChild })
        : fetchPointEntries(token!, { limit: 50 }),
    enabled: !!token,
  });

  const familyQuery = useQuery({
    queryKey: ["points-history-children", token],
    queryFn: () => fetchFamilyMembers(token!),
    enabled: isParent && !!token,
  });

  if (!token) {
    return null;
  }

  const entries = historyQuery.data ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backLabel}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.header}>Seed Adjustments</Text>
        </View>

        {isParent ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            <FilterChip
              label="All kids"
              active={!selectedChild}
              onPress={() => setSelectedChild(undefined)}
            />
            {familyQuery.data
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
        ) : null}

        {historyQuery.isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : entries.length === 0 ? (
          <Text style={styles.lightText}>No entries yet.</Text>
        ) : (
          entries.map((entry) => <HistoryRow key={entry.id} entry={entry} isParent={isParent} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const HistoryRow = ({ entry, isParent }: { entry: PointEntry; isParent: boolean }) => {
  const isGift = entry.points >= 0;
  return (
    <View style={styles.card}>
      <View style={styles.rowHeader}>
        <Text style={styles.entryTitle}>{isGift ? "Gift" : "Penalty"}</Text>
        <Text style={[styles.entryAmount, { color: isGift ? "#16a34a" : "#6366f1" }]}>
          {isGift ? "+" : "-"}
          {Math.abs(entry.points)} seeds
        </Text>
      </View>
      <Text style={styles.entryMeta}>
        {new Date(entry.createdAt).toLocaleString()}
        {isParent && entry.child ? ` · ${entry.child.name}` : ""}
      </Text>
      {isParent && entry.child ? (
        <View style={styles.childRow}>
          <View
            style={[
              styles.avatarDot,
              { backgroundColor: getToneColor(entry.child.avatarTone) },
            ]}
          />
          <Text style={styles.childName}>{entry.child.name}</Text>
        </View>
      ) : null}
      {entry.note ? <Text style={styles.entryNote}>{entry.note}</Text> : null}
      {entry.createdBy ? (
        <Text style={styles.createdBy}>By {entry.createdBy.name}</Text>
      ) : null}
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
  <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </TouchableOpacity>
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
    color: "#1f2937",
  },
  filterRow: {
    marginTop: 8,
    marginBottom: 4,
  },
  loading: {
    paddingVertical: 40,
    alignItems: "center",
  },
  lightText: {
    color: "#6b7280",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    gap: 8,
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  entryAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  entryMeta: {
    color: "#94a3b8",
    fontSize: 12,
  },
  entryNote: {
    color: "#4b5563",
  },
  createdBy: {
    color: "#94a3b8",
    fontSize: 12,
  },
  childRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  avatarDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  childName: {
    color: "#1f2937",
    fontWeight: "600",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 18,
    marginRight: 8,
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
});
