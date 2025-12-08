import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Link } from "expo-router";
import Screen from "../../components/layout/Screen";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useAuth } from "../../hooks/useAuth";

export default function RegisterScreen() {
  const { register, loading, error } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleRegister = async () => {
    if (!name || !email || !password || !confirm) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }

    try {
      await register(name, email, password); // navigation handled in useAuth
    } catch {
      // error already in state
    }
  };

  return (
    <Screen>
      <View className="flex-1 justify-center">
        <Text className="text-xs text-emerald-400 uppercase mb-1">
          Create account
        </Text>
        <Text className="text-2xl font-bold text-white mb-2">
          Join SONREB App
        </Text>
        <Text className="text-slate-400 text-xs mb-6">
          Save SonReb readings, manage projects, and generate calibrated
          strength models directly on site.
        </Text>

        {error ? (
          <Text className="text-red-400 text-xs mb-3">{error}</Text>
        ) : null}

        <View className="gap-3 mb-4">
          <Input label="Full name" value={name} onChangeText={setName} />
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
          <Input
            label="Confirm password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />
        </View>

        <Button
          onPress={handleRegister}
          disabled={loading}
          variant="primary"
        >
          {loading ? "Creating account..." : "Create Account"}
        </Button>

        <View className="flex-row justify-center mt-4">
          <Text className="text-slate-400 text-xs mr-1">
            Already have an account?
          </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text className="text-emerald-400 text-xs">Login</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </Screen>
  );
}
