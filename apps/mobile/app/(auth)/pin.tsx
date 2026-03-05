import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../hooks/useTheme';
import { Colors } from '../../constants/colors';

const PIN_LENGTH = 6;
const PIN_KEY = 'user_pin';

type Stage = 'set' | 'confirm';

export default function PinScreen() {
  const { colors } = useTheme();
  const [stage, setStage] = useState<Stage>('set');
  const [pin, setPin] = useState<string[]>([]);
  const [savedPin, setSavedPin] = useState('');
  const [error, setError] = useState('');

  const handlePress = async (digit: string) => {
    if (pin.length >= PIN_LENGTH) return;
    const updated = [...pin, digit];
    setPin(updated);
    setError('');

    if (updated.length < PIN_LENGTH) return;

    const entered = updated.join('');

    if (stage === 'set') {
      setSavedPin(entered);
      setTimeout(() => {
        setPin([]);
        setStage('confirm');
      }, 300);
    } else {
      if (entered !== savedPin) {
        setError('PINs do not match. Try again.');
        setTimeout(() => {
          setPin([]);
          setStage('set');
          setSavedPin('');
        }, 400);
        return;
      }
      await SecureStore.setItemAsync(PIN_KEY, entered);
      setTimeout(() => router.replace('/(tabs)'), 200);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {stage === 'set' ? 'Set PIN' : 'Confirm PIN'}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {stage === 'set'
          ? 'Create a 6-digit PIN to secure your account'
          : 'Re-enter your PIN to confirm'}
      </Text>

      {/* Dots */}
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
        <View style={{ height: 22 }} />
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 36 },
  dotsRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  errorText: { fontSize: 13, color: Colors.error, marginBottom: 10, textAlign: 'center' },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 280,
    gap: 12,
    justifyContent: 'center',
    marginTop: 16,
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
