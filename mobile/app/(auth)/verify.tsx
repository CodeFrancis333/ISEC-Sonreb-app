import React, { useState } from "react";
import { View, Text, Alert, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Screen from "../../components/layout/Screen";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { sendVerification, confirmVerification } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";
import { getThemeColors, useThemeStore } from "../../store/themeStore";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; uid?: string; code?: string }>();
  const [email, setEmail] = useState(params.email || "");
  const [uid, setUid] = useState(params.uid || "");
  const [code, setCode] = useState(params.code || "");
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const { setUserAndToken } = useAuthStore();
  const { mode } = useThemeStore();
  const theme = getThemeColors(mode);

  const handleSend = async () => {
    if (!email) {
      Alert.alert("Missing email", "Enter your account email.");
      return;
    }
    setLoading(true);
    setInfo(null);
    try {
      const resp = await sendVerification(email);
      if (resp.uid) setUid(resp.uid);
      if (resp.code) setCode(resp.code); // dev visibility
      setInfo("Verification code generated. Check your email (or use the code shown).");
    } catch (err: any) {
      Alert.alert("Failed", err.message || "Could not send code.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!uid || !code) {
      Alert.alert("Missing fields", "Provide UID and code.");
      return;
    }
    setLoading(true);
    try {
      const resp = await confirmVerification(uid, code);
      if (resp.token && resp.user) {
        await setUserAndToken(resp.user, resp.token);
      }
      Alert.alert("Verified", "Email verified. You can now use the app.", [
        { text: "Continue", onPress: () => router.replace("/(main)") },
      ]);
    } catch (err: any) {
      Alert.alert("Failed", err.message || "Invalid code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View className="flex-1 justify-center">
        <Text className="text-xs uppercase mb-1" style={{ color: theme.accent }}>
          Verify email
        </Text>
        <Text className="text-2xl font-bold mb-2" style={{ color: theme.textPrimary }}>
          Enter your OTP
        </Text>
        <Text className="text-xs mb-6" style={{ color: theme.textSecondary }}>
          We sent a 6-digit code to your email. Use it to activate your account.
        </Text>

        {info ? (
          <Text className="text-xs mb-3" style={{ color: theme.success }}>
            {info}
          </Text>
        ) : null}

        <View className="gap-3 mb-4">
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="UID"
            value={uid}
            onChangeText={setUid}
            autoCapitalize="none"
          />
          <Input
            label="Verification code"
            value={code}
            onChangeText={setCode}
            autoCapitalize="none"
          />
        </View>

        <View className="flex-row gap-2">
          <Button onPress={handleSend} disabled={loading} variant="secondary">
            {loading ? "Sending..." : "Resend code"}
          </Button>
          <Button onPress={handleConfirm} disabled={loading} variant="primary">
            {loading ? "Verifying..." : "Verify"}
          </Button>
        </View>

        <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
          <Text className="text-xs mt-4" style={{ color: theme.accent }}>
            Back to login
          </Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}
