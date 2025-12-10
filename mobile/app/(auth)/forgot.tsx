import React, { useState } from "react";
import { View, Text, Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import Screen from "../../components/layout/Screen";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { forgotPassword, resetPassword } from "../../services/authService";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [uid, setUid] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const handleRequest = async () => {
    if (!email) {
      Alert.alert("Missing email", "Please enter your account email.");
      return;
    }
    setLoading(true);
    setInfo(null);
    try {
      const resp = await forgotPassword(email);
      if (resp.uid) setUid(resp.uid);
      if (resp.token) setToken(resp.token);
      setInfo(
        resp.uid && resp.token
          ? "Reset token generated (shown below for testing)."
          : resp.detail || "If this email exists, reset instructions were sent."
      );
    } catch (err: any) {
      Alert.alert("Reset failed", err.message || "Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!uid || !token || !newPassword || !confirmPassword) {
      Alert.alert("Missing fields", "Please request a token and fill all fields.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(uid, token, newPassword, confirmPassword);
      Alert.alert("Success", "Password reset. Please log in.", [
        { text: "OK", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch (err: any) {
      Alert.alert("Reset failed", err.message || "Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View className="flex-1 justify-center">
        <Text className="text-xs text-emerald-400 uppercase mb-1">
          Forgot password
        </Text>
        <Text className="text-2xl font-bold text-white mb-2">
          Reset your account
        </Text>
        <Text className="text-slate-400 text-xs mb-6">
          Request a reset token, then set a new password.
        </Text>

        {info ? <Text className="text-emerald-300 text-xs mb-3">{info}</Text> : null}

        <View className="gap-3 mb-4">
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input label="UID (from email)" value={uid} onChangeText={setUid} />
          <Input
            label="Reset token"
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
          />
          <Input
            label="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <Input
            label="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        <View className="flex-row gap-2">
          <Button onPress={handleRequest} disabled={loading} variant="secondary">
            {loading ? "Working..." : "Request token"}
          </Button>
          <Button onPress={handleReset} disabled={loading} variant="primary">
            {loading ? "Working..." : "Reset password"}
          </Button>
        </View>

        <Link href="/(auth)/login" asChild>
          <Text className="text-emerald-400 text-xs mt-4">Back to login</Text>
        </Link>
      </View>
    </Screen>
  );
}
