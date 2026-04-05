import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Text } from 'react-native-paper';

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  error?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  placeholder?: string;
  helperText?: string;
  theme: any;
  multiline?: boolean;
  numberOfLines?: number;
  icon?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  keyboardType = 'default',
  placeholder,
  helperText,
  theme,
  multiline = false,
  numberOfLines = 1,
  icon,
}) => {
  return (
    <View style={styles.container}>
      <TextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        keyboardType={keyboardType}
        placeholder={placeholder}
        mode="outlined"
        multiline={multiline}
        numberOfLines={numberOfLines}
        dense={!multiline}
        error={!!error}
        style={[styles.input, { backgroundColor: theme.colors.surface }]}
        contentStyle={multiline ? styles.multilineContent : undefined}
        outlineStyle={styles.outline}
        outlineColor={error ? theme.colors.error : theme.colors.outline}
        activeOutlineColor={error ? theme.colors.error : theme.colors.primary}
        placeholderTextColor={theme.colors.outline}
        selectionColor={theme.colors.primary}
        left={icon ? <TextInput.Icon icon={icon} /> : undefined}
        right={
          value.trim() !== '' ? (
            <TextInput.Icon
              icon={error ? 'alert-circle' : 'check-circle'}
              color={error ? theme.colors.error : theme.colors.success}
            />
          ) : undefined
        }
      />
      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}
      {helperText && !error && (
        <Text style={[styles.helperText, { color: theme.colors.outline }]}>
          {helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  input: {
    borderRadius: 18,
  },
  outline: {
    borderWidth: 1,
    borderRadius: 18,
  },
  multilineContent: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  errorText: {
    fontSize: 12,
    marginTop: 5,
    marginLeft: 4,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
