import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Button, Text } from 'react-native-paper';

interface DatePickerCardProps {
  date: Date;
  onPress: () => void;
  theme: any;
  title?: string;
}

export const DatePickerCard: React.FC<DatePickerCardProps> = ({
  date,
  onPress,
  theme,
  title = 'Fecha',
}) => {
  const styles = createStyles(theme);

  const formatDate = (d: Date) =>
    d.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content style={styles.content}>
        <Text variant="titleMedium" style={styles.title}>
          {title}
        </Text>
        <Button
          mode="outlined"
          onPress={onPress}
          style={styles.button}
          contentStyle={styles.buttonContent}
          icon="calendar-month"
        >
          {formatDate(date)}
        </Button>
      </Card.Content>
    </Card>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      marginBottom: 16,
      borderRadius: 22,
      elevation: 1,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    content: {
      paddingVertical: 8,
    },
    title: {
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      marginBottom: 10,
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      fontSize: 12,
    },
    button: {
      borderRadius: 14,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceVariant,
    },
    buttonContent: {
      height: 44,
    },
  });
