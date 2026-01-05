import React from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface DeleteConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export function DeleteConfirmationDialog({
  visible,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isDestructive = true,
}: DeleteConfirmationDialogProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-black/70 justify-center items-center">
        <View className="bg-[#2D2D2D] rounded-xl p-6 w-[85%] max-w-[360] items-center">
          <View className="mb-4">
            <Ionicons
              name={isDestructive ? "warning-outline" : "information-outline"}
              size={40}
              color={isDestructive ? "#EF4444" : "#F59E0B"}
            />
          </View>

          <Text className="text-xl font-semibold text-white text-center mb-2">
            {title}
          </Text>
          <Text className="text-sm text-[#A0A0A0] text-center mb-6 leading-5">
            {message}
          </Text>

          <View className="flex-row gap-3 w-full">
            <Pressable
              className="flex-1 py-3 rounded-lg items-center bg-[#3D3D3D]"
              onPress={onCancel}
            >
              <Text className="text-white text-base font-medium">
                {cancelText}
              </Text>
            </Pressable>

            <Pressable
              className={`flex-1 py-3 rounded-lg items-center ${isDestructive ? "bg-red-500" : "bg-blue-500"}`}
              onPress={onConfirm}
            >
              <Text className="text-white text-base font-semibold">
                {confirmText}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
