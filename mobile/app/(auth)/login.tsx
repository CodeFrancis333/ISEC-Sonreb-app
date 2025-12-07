import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Link, useRouter } from "expo-router";
import Screen from "../../components/layout/Screen";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import useAuth from "../../hooks/useAuth";

export default function LoginScreen() {
  const router = useRouter();
  const { login, loading, error } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async () => {
    const ok = await login(email, password);
    if (ok) {
      router.replace("/(main)");
    }
  };

  return (
    <Screen>
      <View className="flex-1">
        <Text className="text-xl font-bold text-white mb-2">
          Login
        </Text>
        <Text className="text-slate-300 mb-6">
          Continue to your SonReb projects.
        </Text>

        {error && (
          <View className="mb-4 rounded-lg bg-red-500/10 border border-red-500/40 px-3 py-2">
            <Text className="text-xs text-red-300">{error}</Text>
          </View>
        )}

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="you@example.com"
        />

        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
        />

        <Button
          title={loading ? "Logging in..." : "Login"}
          onPress={handleSubmit}
          disabled={loading}
        />

        <View className="mt-4 flex-row justify-between items-center">
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text className="text-xs text-emerald-300">
                Create an account
              </Text>
            </TouchableOpacity>
          </Link>

          <TouchableOpacity>
            <Text className="text-xs text-slate-400">
              Forgot password?
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}
