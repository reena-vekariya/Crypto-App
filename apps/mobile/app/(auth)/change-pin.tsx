import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Colors } from '../../constants/colors';

const PIN_LENGTH = 6;
const PIN_KEY = 'user_pin';

type Stage = 'current' | 'new' | 'confirm';

const STAGE_CONFIG: Record<Stage, { title: string; subtitle: string }> = {
  current: {
    title: 'Current PIN',
    subtitle: 'Enter your current 6-digit PIN',
  },
  new: {
    title: 'New PIN',
    subtitle: 'Enter a new 6-digit PIN',
  },
  confirm: {
    title: 'Confirm PIN',
    subtitle: 'Re-enter your new PIN to confirm',
  },
};

export default function ChangePinScreen() {
  const { colors } = useTheme();
  const [stage, setStage] = useState<Stage>('current');
  const [pin, setPin] = useState<string[]>([]);
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState('');

  const handlePress = async (digit: string) => {
    if (pin.length >= PIN_LENGTH) return;
    const updated = [...pin, digit];
    setPin(updated);
    setError('');

    if (updated.length < PIN_LENGTH) return;

    const entered = updated.join('');

    if (stage === 'current') {
      const saved = await SecureStore.getItemAsync(PIN_KEY);
      // If no PIN set yet, skip current PIN check
      if (saved && saved !== entered) {
        setError('Incorrect PIN. Try again.');
        setTimeout(() => setPin([]), 400);
        return;
      }
      setTimeout(() => {
        setPin([]);
        setStage('new');
      }, 300);
    } else if (stage === 'new') {
      setNewPin(entered);
      setTimeout(() => {
        setPin([]);
        setStage('confirm');
      }, 300);
    } else if (stage === 'confirm') {
      if (entered !== newPin) {
        setError('PINs do not match. Try again.');
        setTimeout(() => {
          setPin([]);
          setStage('new');
          setNewPin('');
        }, 400);
        return;
      }
      await SecureStore.setItemAsync(PIN_KEY, entered);
      Alert.alert('Success', 'Your PIN has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const config = STAGE_CONFIG[stage];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Back button */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={26} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.body}>
        {/* Stage indicator */}
        <View style={styles.stageRow}>
          {(['current', 'new', 'confirm'] as Stage[]).map((s, i) => (
            <View
              key={s}
              style={[
                styles.stageDot,
                {
                  backgroundColor:
                    s === stage
                      ? Colors.primary
                      : (['current', 'new', 'confirm'] as Stage[]).indexOf(stage) > i
                      ? Colors.success
                      : colors.border,
                },
              ]}
            />
          ))}
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{config.title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{config.subtitle}</Text>

        {/* PIN dots */}
        <View style={styles.dotsRow}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { borderColor: error ? Colors.error : colors.border },
                i < pin.length && {
                  backgroundColor: error ? Colors.error : Colors.primary,
                  borderColor: error ? Colors.error : Colors.primary,
                },
              ]}
            />
          ))}
        </View>

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <View style={styles.errorPlaceholder} />
        )}

        {/* Keypad */}
        <View style={styles.keypad}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.key,
                { backgroundColor: key === '' ? 'transparent' : colors.surface },
              ]}
              onPress={() => {
                if (key === 'del') handleDelete();
                else if (key !== '') handlePress(key);
              }}
              activeOpacity={0.7}
              disabled={key === ''}
            >
              <Text
                style={[
                  styles.keyText,
                  { color: key === 'del' ? Colors.error : colors.text },
                ]}
              >
                {key === 'del' ? '⌫' : key}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  backBtn: { padding: 16 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  stageRow: { flexDirection: 'row', gap: 8, marginBottom: 32 },
  stageDot: { width: 10, height: 10, borderRadius: 5 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 36 },
  dotsRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  errorText: { fontSize: 13, color: Colors.error, marginBottom: 20, textAlign: 'center' },
  errorPlaceholder: { height: 33, marginBottom: 20 },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 280,
    gap: 12,
    justifyContent: 'center',
    marginTop: 8,
  },
  key: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: { fontSize: 24, fontWeight: '500' },
});
