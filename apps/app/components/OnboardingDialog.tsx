import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { needsOnboarding, useSettings } from "@/hooks/useSettings";
import { sampleDataApi } from "@/lib/api";

const STEPS = [
  {
    icon: "sparkles" as const,
    title: "Welcome to Ledger-X",
    body: "Keep one simple book of who owes you and what you've been paid. Everything is private to your account.",
  },
  {
    icon: "person-add" as const,
    title: "Add your first customer",
    body: "Create a customer, then record credits (what they owe) and payments (what they've paid) against them.",
  },
  {
    icon: "wallet" as const,
    title: "Record payments and collect",
    body: "Tag each entry with Cash or UPI, share statements, and send a UPI QR for the outstanding balance. Payments are always recorded manually.",
  },
];

/**
 * First-run flow. Both finishing and skipping persist the decision in
 * `user_settings`, so the dialog never reappears (task 10.3).
 */
export function OnboardingDialog() {
  const { settings, loading, update } = useSettings();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [seeding, setSeeding] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && needsOnboarding(settings)) {
      setOpen(true);
    }
  }, [loading, settings]);

  const finish = async () => {
    setSaving(true);
    try {
      await update({ onboardingCompleted: true });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const skip = async () => {
    setSaving(true);
    try {
      await update({ onboardingDismissed: true });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const loadSample = async () => {
    setSeeding(true);
    try {
      await sampleDataApi.seed();
    } catch {
      // The dashboard reflects the failure; onboarding continues regardless.
    } finally {
      setSeeding(false);
    }
  };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={skip}>
      <View className="flex-1 bg-black/70 items-center justify-center px-6">
        <View className="w-full rounded-2xl bg-[#171717] border border-[#333333] p-6">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row gap-1.5">
              {STEPS.map((_, index) => (
                <View
                  key={index}
                  className="h-1.5 rounded-full"
                  style={{
                    width: index === step ? 20 : 6,
                    backgroundColor: index <= step ? "#10B981" : "#333333",
                  }}
                />
              ))}
            </View>
            <Text className="text-[10px] font-semibold uppercase tracking-widest text-[#666666]">
              Step {step + 1} of {STEPS.length}
            </Text>
          </View>

          <View className="items-center py-2">
            <View className="w-14 h-14 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/25 items-center justify-center mb-4">
              <Ionicons name={current.icon} size={26} color="#10B981" />
            </View>
            <Text className="text-lg font-bold text-white text-center">
              {current.title}
            </Text>
            <Text className="text-sm text-[#888888] text-center mt-2 leading-5">
              {current.body}
            </Text>
          </View>

          {step === 0 && (
            <Pressable
              onPress={loadSample}
              disabled={seeding}
              className="mt-4 flex-row items-center justify-center gap-2 rounded-xl border border-[#333333] bg-[#1F1F1F] py-3"
            >
              {seeding ? (
                <ActivityIndicator size="small" color="#10B981" />
              ) : (
                <Ionicons name="flask" size={14} color="#10B981" />
              )}
              <Text className="text-xs font-semibold text-[#10B981]">
                Load sample data to look around
              </Text>
            </Pressable>
          )}

          <View className="flex-row items-center justify-between mt-6">
            <Pressable onPress={skip} disabled={saving}>
              <Text className="text-xs text-[#888888]">Skip for now</Text>
            </Pressable>

            <View className="flex-row gap-2">
              {step > 0 && (
                <Pressable
                  onPress={() => setStep((value) => value - 1)}
                  className="px-4 py-2.5 rounded-lg border border-[#333333]"
                >
                  <Text className="text-xs font-semibold text-white">Back</Text>
                </Pressable>
              )}
              <Pressable
                onPress={() =>
                  isLast ? finish() : setStep((value) => value + 1)
                }
                disabled={saving}
                className="px-4 py-2.5 rounded-lg bg-[#10B981]"
              >
                <Text className="text-xs font-bold text-black">
                  {isLast ? "Finish setup" : "Next"}
                </Text>
              </Pressable>
            </View>
          </View>

          {isLast && (
            <Text className="text-center text-[11px] text-[#666666] mt-4">
              You can change UPI settings any time in Profile.
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}
