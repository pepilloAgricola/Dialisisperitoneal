import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';

interface BalanceDisplayProps {
  balance: number;
  label?: string;
  theme: any;
  size?: 'small' | 'medium' | 'large';
  polarity?: 'standard' | 'inverted';
  valueColor?: string;
  style?: ViewStyle;
}

export const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  balance,
  label = 'Balance',
  theme,
  size = 'medium',
  polarity = 'standard',
  valueColor,
  style,
}) => {
  const getBalanceColor = (bal: number): string => {
    if (bal === 0) return theme.colors.outline;

    if (polarity === 'inverted') {
      return bal < 0 ? theme.colors.success : theme.colors.error;
    }

    if (bal > 0) return theme.colors.success;
    if (bal < 0) return theme.colors.error;
    return theme.colors.outline;
  };

  const sizes = {
    small: { labelSize: 12, valueSize: 16 },
    medium: { labelSize: 14, valueSize: 20 },
    large: { labelSize: 16, valueSize: 24 },
  };

  const sizeConfig = sizes[size];
  const color = valueColor ?? getBalanceColor(balance);
  const formattedBalance = `${balance > 0 ? '+' : ''}${balance.toLocaleString('es-ES')} ml`;
  const tintedBackground = balance === 0 ? theme.colors.surface : `${color}12`;
  const tintedBorder = balance === 0 ? theme.colors.outlineVariant : `${color}45`;

  return (
    <View
      style={[
        styles.container,
        style,
        { backgroundColor: tintedBackground, borderColor: tintedBorder },
      ]}
    >
      <Text style={[styles.label, { fontSize: sizeConfig.labelSize, color: theme.colors.outline }]}>
        {label}
      </Text>
      <Text
        style={[
          styles.value,
          {
            fontSize: sizeConfig.valueSize,
            color,
          },
        ]}
      >
        {formattedBalance}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  label: {
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  value: {
    fontWeight: '700',
  },
});
