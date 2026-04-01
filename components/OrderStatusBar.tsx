import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const STEPS: { status: string; label: string; emoji: string }[] = [
  { status: 'PLACED', label: 'Placed', emoji: '📝' },
  { status: 'ACCEPTED', label: 'Accepted', emoji: '✅' },
  { status: 'PREPARING', label: 'Preparing', emoji: '👨‍🍳' },
  { status: 'READY', label: 'Ready', emoji: '📦' },
  { status: 'PICKED_UP', label: 'Picked Up', emoji: '🚗' },
  { status: 'DELIVERED', label: 'Delivered', emoji: '🎉' },
];

const TERMINAL_STATUSES = ['CANCELLED', 'REJECTED'];

interface Props {
  currentStatus: string;
}

export default function OrderStatusBar({ currentStatus }: Props) {
  const normalised = currentStatus.toUpperCase();
  if (TERMINAL_STATUSES.includes(normalised)) {
    return (
      <View style={styles.terminalContainer}>
        <Text style={styles.terminalEmoji}>
          {normalised === 'CANCELLED' ? '❌' : '🚫'}
        </Text>
        <Text style={styles.terminalText}>
          {normalised === 'CANCELLED' ? 'Order Cancelled' : 'Order Rejected'}
        </Text>
      </View>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.status === normalised);

  return (
    <View style={styles.container}>
      {STEPS.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <View key={step.status} style={styles.stepWrapper}>
            <View style={styles.stepRow}>
              {index > 0 && (
                <View
                  style={[
                    styles.connector,
                    isCompleted && styles.connectorActive,
                  ]}
                />
              )}
              <View
                style={[
                  styles.circle,
                  isCompleted && styles.circleActive,
                  isCurrent && styles.circleCurrent,
                ]}
              >
                <Text style={styles.emoji}>{step.emoji}</Text>
              </View>
            </View>
            <Text
              style={[
                styles.label,
                isCompleted && styles.labelActive,
                isCurrent && styles.labelCurrent,
              ]}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  stepWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connector: {
    height: 3,
    flex: 1,
    backgroundColor: '#E0E0E0',
    marginRight: -4,
  },
  connectorActive: {
    backgroundColor: '#009DE0',
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  circleActive: {
    borderColor: '#009DE0',
    backgroundColor: '#E6F5FC',
  },
  circleCurrent: {
    borderColor: '#009DE0',
    backgroundColor: '#009DE0',
  },
  emoji: {
    fontSize: 16,
  },
  label: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  labelActive: {
    color: '#333',
  },
  labelCurrent: {
    fontWeight: '700',
    color: '#009DE0',
  },
  terminalContainer: {
    alignItems: 'center',
    padding: 20,
  },
  terminalEmoji: {
    fontSize: 48,
  },
  terminalText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E74C3C',
    marginTop: 8,
  },
});
