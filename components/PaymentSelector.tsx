import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { PaymentMethod } from '../types';

const METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'CASH', label: 'Cash', icon: '💵' },
  { value: 'CREDIT_CARD', label: 'Credit Card', icon: '💳' },
  { value: 'DEBIT_CARD', label: 'Debit Card', icon: '🏦' },
];

interface Props {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}

export default function PaymentSelector({ selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Method</Text>
      {METHODS.map((method) => (
        <TouchableOpacity
          key={method.value}
          style={[
            styles.option,
            selected === method.value && styles.optionSelected,
          ]}
          onPress={() => onSelect(method.value)}
        >
          <Text style={styles.icon}>{method.icon}</Text>
          <Text
            style={[
              styles.label,
              selected === method.value && styles.labelSelected,
            ]}
          >
            {method.label}
          </Text>
          <View
            style={[
              styles.radio,
              selected === method.value && styles.radioSelected,
            ]}
          >
            {selected === method.value && <View style={styles.radioDot} />}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  optionSelected: {
    borderColor: '#009DE0',
    backgroundColor: '#F0F9FF',
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  labelSelected: {
    fontWeight: '600',
    color: '#009DE0',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#009DE0',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#009DE0',
  },
});
