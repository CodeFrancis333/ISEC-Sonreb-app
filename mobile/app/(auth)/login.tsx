import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import Screen from "../../components/layout/Screen";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";
import { getThemeColors, useThemeStore } from "../../store/themeStore";

export default function LoginScreen() {
  const { login, loading, error } = useAuth();
  const router = useRouter();
  const { mode } = useThemeStore();
  const theme = getThemeColors(mode);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing fields", "Please enter email and password.");
      return;
    }
    try {
      await login(email, password); // useAuth will navigate on success
    } catch {
      // error already stored in state and shown below
    }
  };

  return (
    <Screen>
      <View className="flex-1 justify-center">
        <Text className="text-xs uppercase mb-1" style={{ color: theme.accent }}>
          Welcome back
        </Text>
        <Text className="text-2xl font-bold mb-2" style={{ color: theme.textPrimary }}>
          Login to SONREB App
        </Text>
        <Text className="text-xs mb-6" style={{ color: theme.textSecondary }}>
          Continue estimating in-place concrete strength from your calibrated
          SonReb models.
        </Text>

        {error ? (
          <Text className="text-xs mb-3" style={{ color: theme.error }}>
            {error}
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
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <Button onPress={handleLogin} disabled={loading} variant="primary">
          {loading ? "Logging in..." : "Login"}
        </Button>

        <View className="flex-row justify-between items-center mt-4">
          <TouchableOpacity
            onPress={() => router.push("/(auth)/register")}
            className="pr-2"
          >
            <Text className="text-xs" style={{ color: theme.accent }}>
              Create an account
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/(auth)/forgot")}>
            <Text className="text-xs" style={{ color: theme.textSecondary }}>
              Forgot password?
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}
