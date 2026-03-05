import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  Switch,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useLogout } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/auth.store';
import { Colors } from '../../constants/colors';

interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  rightContent?: React.ReactNode;
  danger?: boolean;
  isLast?: boolean;
}

function SettingRow({ icon, label, onPress, rightContent, danger = false, isLast = false }: SettingRowProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.row, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress && !rightContent}
    >
      <View style={[styles.iconContainer, { backgroundColor: danger ? '#FFE6E6' : Colors.primaryLight }]}>
        <Ionicons name={icon} size={18} color={danger ? Colors.error : Colors.primary} />
      </View>
      <Text style={[styles.rowLabel, { color: danger ? Colors.error : colors.text }]}>{label}</Text>
      <View style={styles.rowRight}>
        {rightContent ?? (
          onPress && <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { colors, isDark, toggle } = useTheme();
  const user = useAuthStore((s) => s.user);
  const biometricEnabled = useAuthStore((s) => s.biometricEnabled);
  const setBiometricEnabled = useAuthStore((s) => s.setBiometricEnabled);
  const logout = useLogout();

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<'Face ID' | 'Touch ID' | 'Biometrics'>('Biometrics');

  // Check hardware support on mount
  useEffect(() => {
    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (hasHardware && isEnrolled) {
        setBiometricAvailable(true);
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('Touch ID');
        }
      }
    })();
  }, []);

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      // Verify with biometrics before enabling
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Enable ${biometricType} for CryptoApp`,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: false,
      });

      if (result.success) {
        await setBiometricEnabled(true);
        Alert.alert(
          `${biometricType} Enabled`,
          `You can now use ${biometricType} to unlock the app.`,
        );
      } else if (result.error !== 'user_cancel' && result.error !== 'system_cancel') {
        Alert.alert('Authentication Failed', 'Could not verify your identity. Please try again.');
      }
    } else {
      // Confirm before disabling
      Alert.alert(
        `Disable ${biometricType}`,
        `Are you sure you want to disable ${biometricType} login?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: () => setBiometricEnabled(false),
          },
        ],
      );
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: Colors.primary }]}>
            <Text style={styles.avatarText}>
              {user?.fullName?.charAt(0)?.toUpperCase() ?? 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>{user?.fullName ?? 'User'}</Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
          </View>
        </View>

        {/* Preferences */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>PREFERENCES</Text>
        <View style={[styles.section, { borderColor: colors.border }]}>
          <SettingRow
            icon={isDark ? 'moon' : 'sunny-outline'}
            label="Dark Mode"
            rightContent={
              <Switch
                value={isDark}
                onValueChange={toggle}
                trackColor={{ false: colors.border, true: Colors.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <SettingRow
            icon="notifications-outline"
            label="Notifications"
            onPress={() => Alert.alert('Notifications', 'Coming soon!')}
            isLast
          />
        </View>

        {/* Security */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>SECURITY</Text>
        <View style={[styles.section, { borderColor: colors.border }]}>
          <SettingRow
            icon="keypad-outline"
            label="Change PIN"
            onPress={() => router.push('/(auth)/change-pin')}
          />
          {biometricAvailable && (
            <SettingRow
              icon={biometricType === 'Face ID' ? 'scan-outline' : 'finger-print-outline'}
              label={biometricType}
              rightContent={
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleBiometricToggle}
                  trackColor={{ false: colors.border, true: Colors.primary }}
                  thumbColor="#FFFFFF"
                />
              }
              isLast
            />
          )}
          {!biometricAvailable && (
            <SettingRow
              icon="finger-print-outline"
              label="Biometrics Unavailable"
              rightContent={
                <Text style={[styles.unavailableText, { color: colors.textSecondary }]}>
                  Not set up
                </Text>
              }
              isLast
            />
          )}
        </View>

        {/* Account */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ACCOUNT</Text>
        <View style={[styles.section, { borderColor: colors.border }]}>
          <SettingRow
            icon="log-out-outline"
            label="Sign Out"
            onPress={handleLogout}
            danger
            isLast
          />
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 24, fontWeight: '700' },
  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: '600' },
  profileEmail: { fontSize: 13, marginTop: 2 },
  sectionLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8 },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 15 },
  rowRight: { alignItems: 'center', justifyContent: 'center' },
  unavailableText: { fontSize: 13 },
  bottomSpace: { height: 40 },
});
