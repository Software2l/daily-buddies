import { useEffect, useState } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
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
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useAuth } from "../../../src/context/AuthContext";
import { useI18n } from "../../../src/context/I18nContext";
import {
  fetchPrivileges,
  createPrivilege,
  deletePrivilege,
  fetchPrivilegeRequests,
  decidePrivilegeRequest,
  terminatePrivilegeRequest,
} from "../../../src/services/api";

const TONE_COLORS: Record<string, string> = {
  sunrise: "#fb923c",
  forest: "#22c55e",
  ocean: "#38bdf8",
  lavender: "#c084fc",
  sunset: "#f87171",
  default: "#94a3b8",
};

const getToneColor = (tone?: string | null) => TONE_COLORS[tone ?? ""] ?? TONE_COLORS.default;

export default function FamilyPrivilegesScreen() {
  const router = useRouter();
  const { token, profile } = useAuth();
  const { translations: t } = useI18n();
  const insets = useSafeAreaInsets();
  const isParent = profile?.role === "PARENT";
  const [form, setForm] = useState({ title: "", cost: "1", description: "" });

  const privilegesQuery = useQuery({
    queryKey: ["family-privileges", token],
    queryFn: () => fetchPrivileges(token!),
    enabled: isParent && !!token,
  });

  const requestsQuery = useQuery({
    queryKey: ["family-privilege-requests", token],
    queryFn: () => fetchPrivilegeRequests(token!),
    enabled: isParent && !!token,
  });

  useEffect(() => {
    if (!isParent && profile?.role === "CHILD") {
      router.replace("/privileges");
    }
  }, [isParent, profile?.role, router]);

  const createPrivilegeMutation = useMutation({
    mutationFn: (payload: { title: string; description?: string; cost: number }) => createPrivilege(token!, payload),
    onSuccess: async () => {
      setForm({ title: "", cost: "1", description: "" });
      await privilegesQuery.refetch();
    },
    onError: (error: Error) => Alert.alert(t.privileges.unableAdd, error.message),
  });

  const deletePrivilegeMutation = useMutation({
    mutationFn: (privilegeId: string) => deletePrivilege(token!, privilegeId),
    onSuccess: async () => {
      await privilegesQuery.refetch();
    },
    onError: (error: Error) => Alert.alert(t.privileges.unableRemove, error.message),
  });

  const decideMutation = useMutation({
    mutationFn: ({ requestId, status }: { requestId: string; status: "APPROVED" | "REJECTED" }) =>
      decidePrivilegeRequest(token!, requestId, { status }),
    onSuccess: async () => {
      await requestsQuery.refetch();
    },
    onError: (error: Error) => Alert.alert(t.privileges.unableUpdateRequest, error.message),
  });

  const terminateMutation = useMutation({
    mutationFn: (requestId: string) => terminatePrivilegeRequest(token!, requestId),
    onSuccess: async () => {
      await requestsQuery.refetch();
      Alert.alert(t.privileges.ticketEndedTitle, t.privileges.ticketEndedMessage);
    },
    onError: (error: Error) => Alert.alert(t.privileges.unableTerminate, error.message),
  });

  if (!token) {
    return null;
  }

  if (!isParent) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.fallback}>
          <Text style={styles.lightText}>{t.privileges.onlyParents}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace("/home")}>
            <Text style={styles.primaryText}>{t.privileges.returnHome}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const requests = requestsQuery.data ?? [];
  const pendingRequests = requests.filter((request) => request.status === "PENDING");
  const activeTickets = requests.filter((request) => request.status === "APPROVED");

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.container, { paddingBottom: 32 + insets.bottom }]}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backLabel}>← {t.privileges.back}</Text>
            </TouchableOpacity>
            <Text style={styles.header}>{t.privileges.title}</Text>
          </View>
          <Text style={styles.subtitle}>{t.privileges.subtitle}</Text>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t.privileges.privilegeIdeas}</Text>
            <Text style={styles.lightText}>{t.privileges.privilegeIdeasHint}</Text>
            <View style={styles.privilegeList}>
              {(privilegesQuery.data ?? []).length === 0 ? (
                <Text style={styles.lightText}>{t.privileges.noPrivileges}</Text>
              ) : (
                privilegesQuery.data!.map((privilege) => (
                  <View key={privilege.id} style={styles.privilegeRow}>
                    <View style={styles.privilegeInfo}>
                      <Text style={styles.privilegeTitle}>{privilege.title}</Text>
                      {privilege.description ? <Text style={styles.lightText}>{privilege.description}</Text> : null}
                    </View>
                    <View style={styles.privilegeActions}>
                      <Text style={styles.privilegeCost}>
                        {privilege.cost} {t.privileges.seedsSuffix}
                      </Text>
                      <TouchableOpacity
                        onPress={() => deletePrivilegeMutation.mutate(privilege.id)}
                        style={styles.smallGhostButton}
                      >
                        <Text style={styles.smallGhostText}>{t.privileges.remove}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t.privileges.pendingRequests}</Text>
            {pendingRequests.length === 0 ? (
              <Text style={styles.lightText}>{t.privileges.noRequests}</Text>
            ) : (
              pendingRequests.map((request) => (
                <View key={request.id} style={styles.requestRow}>
                  <View style={styles.requestHeader}>
                    <View style={styles.requestInfo}>
                      <Text style={styles.privilegeTitle}>{request.privilege.title}</Text>
                      <Text style={styles.lightText}>
                        {request.childName ?? t.privileges.unknownChild} • {request.cost} {t.privileges.seedsSuffix}
                      </Text>
                    </View>
                    <View style={[styles.requestStatusPill, styles.requestStatusPending]}>
                      <Text style={styles.requestStatusText}>{t.privileges.pendingLabel}</Text>
                    </View>
                  </View>
                  {request.note ? <Text style={styles.lightText}>Note: {request.note}</Text> : null}
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => decideMutation.mutate({ requestId: request.id, status: "APPROVED" })}
                      disabled={decideMutation.isPending}
                    >
                      <Text style={styles.approveText}>
                        {decideMutation.isPending ? "..." : t.privileges.approve}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.smallGhostButton}
                      onPress={() => decideMutation.mutate({ requestId: request.id, status: "REJECTED" })}
                      disabled={decideMutation.isPending}
                    >
                      <Text style={styles.smallGhostText}>{t.privileges.reject}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.sectionTitle}>{t.privileges.activeTickets}</Text>
              <TouchableOpacity style={styles.linkButton} onPress={() => router.push("/privileges/history")}>
                <Text style={styles.linkText}>{t.privileges.ticketHistory}</Text>
              </TouchableOpacity>
            </View>
            {activeTickets.length === 0 ? (
              <Text style={styles.lightText}>{t.privileges.noActiveTickets}</Text>
            ) : (
              activeTickets.map((ticket) => (
                <View key={ticket.id} style={styles.requestRow}>
                  <View style={styles.requestHeader}>
                    <View style={styles.requestInfo}>
                      <View style={styles.metaRow}>
                        <View
                          style={[
                            styles.avatarDot,
                            { backgroundColor: getToneColor(ticket.childAvatarTone ?? profile?.avatarTone) },
                          ]}
                        />
                        <Text style={styles.privilegeTitle}>{ticket.privilege.title}</Text>
                      </View>
                      <Text style={styles.lightText}>
                        {ticket.childName ?? t.privileges.unknownChild} • {ticket.cost} {t.privileges.seedsSuffix}
                      </Text>
                    </View>
                    <View style={[styles.requestStatusPill, styles.requestStatusApproved]}>
                      <Text style={styles.requestStatusText}>{t.privileges.approvedLabel}</Text>
                    </View>
                  </View>
                  {ticket.note ? <Text style={styles.lightText}>Note: {ticket.note}</Text> : null}
                  <TouchableOpacity
                    style={[styles.smallGhostButton, styles.terminateButton]}
                    onPress={() => terminateMutation.mutate(ticket.id)}
                    disabled={terminateMutation.isPending}
                  >
                    <Text style={styles.terminateText}>
                      {terminateMutation.isPending ? t.privileges.terminating : t.privileges.terminate}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t.privileges.addPrivilege}</Text>
            <Text style={styles.lightText}>{t.privileges.addPrivilegeHint}</Text>
            <PrivilegeInput
              label={t.privileges.titleLabel}
              value={form.title}
              onChangeText={(value) => setForm((prev) => ({ ...prev, title: value }))}
            />
            <PrivilegeInput
              label={t.privileges.costLabel}
              value={form.cost}
              keyboardType="numeric"
              onChangeText={(value) => setForm((prev) => ({ ...prev, cost: value }))}
            />
            <PrivilegeInput
              label={t.privileges.descriptionLabel}
              value={form.description}
              onChangeText={(value) => setForm((prev) => ({ ...prev, description: value }))}
            />
            <TouchableOpacity
              style={[styles.primaryButton, createPrivilegeMutation.isPending && styles.disabled]}
              onPress={() => {
                if (!form.title.trim()) {
                  Alert.alert(t.privileges.titleRequiredTitle, t.privileges.titleRequiredMessage);
                  return;
                }
                createPrivilegeMutation.mutate({
                  title: form.title.trim(),
                  cost: Number(form.cost) || 1,
                  description: form.description || undefined,
                });
              }}
              disabled={createPrivilegeMutation.isPending}
            >
              <Text style={styles.primaryText}>
                {createPrivilegeMutation.isPending ? t.privileges.addingPrivilege : t.privileges.addPrivilegeButton}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const PrivilegeInput = ({ label, keyboardType = "default", ...props }: React.ComponentProps<typeof TextInput> & { label: string }) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <TextInput style={styles.input} keyboardType={keyboardType} placeholderTextColor="#94a3b8" {...props} />
  </View>
);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f5f3ff",
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
  fallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
  },
  privilegeList: {
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },
  privilegeRow: {
    borderWidth: 1,
    borderColor: "#e0e7ff",
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  privilegeInfo: {
    gap: 4,
  },
  privilegeActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  privilegeTitle: {
    fontWeight: "600",
    color: "#1f2937",
  },
  avatarDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  privilegeCost: {
    color: "#4c1d95",
    fontWeight: "600",
  },
  smallGhostButton: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  smallGhostText: {
    color: "#475569",
    fontWeight: "600",
  },
  requestRow: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 12,
    gap: 8,
  },
  requestHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  requestInfo: {
    gap: 4,
    flex: 1,
  },
  requestStatusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  requestStatusText: {
    fontWeight: "600",
    color: "#312e81",
    textTransform: "capitalize",
  },
  requestStatusPending: {
    backgroundColor: "#eef2ff",
  },
  requestStatusApproved: {
    backgroundColor: "#dcfce7",
  },
  requestActions: {
    flexDirection: "row",
    gap: 8,
  },
  approveButton: {
    backgroundColor: "#22c55e",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  approveText: {
    color: "#fff",
    fontWeight: "600",
  },
  terminateButton: {
    borderColor: "#fecaca",
    marginTop: 6,
  },
  terminateText: {
    color: "#dc2626",
    fontWeight: "600",
    textAlign: "center",
  },
  sectionTitle: {
    fontWeight: "700",
    color: "#111827",
  },
  lightText: {
    color: "#94a3b8",
  },
  field: {
    gap: 6,
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
  linkButton: {
    paddingVertical: 4,
  },
  linkText: {
    color: "#6c63ff",
    fontWeight: "600",
  },
});
