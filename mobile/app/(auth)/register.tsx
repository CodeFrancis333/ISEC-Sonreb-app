import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Link, useRouter } from "expo-router";
import Screen from "../../components/layout/Screen";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import useAuth from "../../hooks/useAuth";

export default function RegisterScreen() {
  const router = useRouter();
  const { register, loading, error } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleSubmit = async () => {
    if (password !== confirm) {
      // simple local check
      alert("Passwords do not match.");
      return;
    }

    const ok = await register(name, email, password);
    if (ok) {
      router.replace("/(main)");
    }
  };

  return (
    <Screen>
      <View className="flex-1">
        <Text className="text-xl font-bold text-white mb-2">
          Create Account
        </Text>
        <Text className="text-slate-300 mb-6">
          Set up your SonReb profile to manage projects and readings.
        </Text>

        {error && (
          <View className="mb-4 rounded-lg bg-red-500/10 border border-red-500/40 px-3 py-2">
            <Text className="text-xs text-red-300">{error}</Text>
          </View>
        )}

        <Input
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="Engineer Name"
        />

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

        <Input
          label="Confirm Password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          placeholder="••••••••"
        />

        <Button
          title={loading ? "Creating account..." : "Create Account"}
          onPress={handleSubmit}
          disabled={loading}
        />

        <View className="mt-4 flex-row justify-center">
          <Text className="text-xs text-slate-400 mr-1">
            Already have an account?
          </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text className="text-xs text-emerald-300">
                Login
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </Screen>
  );
}
