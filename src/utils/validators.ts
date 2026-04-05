import React from 'react';

/**
 * Sistema centralizado de validación
 * Sin rangos médicos, solo validaciones técnicas y de consistencia básica
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const MAX_NUMERIC_VALUE = 200000;

// Acepta enteros o decimales con punto o coma, con signo opcional.
const DECIMAL_PATTERN = /^[-+]?\d+(?:[.,]\d+)?$/;

const normalizeNumericText = (value: string): string => value.trim().replace(',', '.');

const parseStrictNumber = (raw: string): number | null => {
  const normalized = normalizeNumericText(raw);
  if (!DECIMAL_PATTERN.test(normalized)) return null;
  const num = Number(normalized);
  if (!Number.isFinite(num)) return null;
  return num;
};

const buildNumberValidator = (
  value: string,
  fieldName: string,
  rule: (num: number) => ValidationResult
): ValidationResult => {
  if (!value.trim()) {
    return { valid: false, error: `${fieldName} es requerido` };
  }

  const num = parseStrictNumber(value);
  if (num === null) {
    return { valid: false, error: `${fieldName} debe ser un número válido` };
  }

  if (Math.abs(num) > MAX_NUMERIC_VALUE) {
    return { valid: false, error: `${fieldName} es demasiado grande` };
  }

  return rule(num);
};

const sanitizeText = (value: string): string => value.replace(/\s+/g, ' ').trim();

export const validators = {
  normalizeNumericInput: (value: string): string => normalizeNumericText(value),

  // Validación de números positivos
  positiveNumber: (value: string, fieldName: string = 'Valor'): ValidationResult =>
    buildNumberValidator(value, fieldName, (num) => {
      if (num < 0) return { valid: false, error: `${fieldName} no puede ser negativo` };
      if (num === 0) return { valid: false, error: `${fieldName} debe ser mayor a 0` };
      return { valid: true };
    }),

  // Validación de números que pueden ser cero
  nonNegativeNumber: (value: string, fieldName: string = 'Valor'): ValidationResult =>
    buildNumberValidator(value, fieldName, (num) => {
      if (num < 0) return { valid: false, error: `${fieldName} no puede ser negativo` };
      return { valid: true };
    }),

  // Validación de números con signo (positivo, negativo o cero)
  signedNumber: (value: string, fieldName: string = 'Valor'): ValidationResult =>
    buildNumberValidator(value, fieldName, () => ({ valid: true })),

  // Validación de texto (nombre, etc.)
  text: (value: string, fieldName: string = 'Campo'): ValidationResult => {
    const clean = sanitizeText(value);
    if (!clean) {
      return { valid: false, error: `${fieldName} es requerido` };
    }
    if (clean.length < 2) {
      return { valid: false, error: `${fieldName} debe tener al menos 2 caracteres` };
    }
    if (clean.length > 80) {
      return { valid: false, error: `${fieldName} es demasiado largo` };
    }
    if (/[^a-záéíóúñA-ZÁÉÍÓÚÑ\s]/.test(clean)) {
      return { valid: false, error: `${fieldName} contiene caracteres inválidos` };
    }
    return { valid: true };
  },

  // Validación de edad
  age: (value: string): ValidationResult =>
    buildNumberValidator(value, 'Edad', (num) => {
      if (!Number.isInteger(num)) {
        return { valid: false, error: 'Edad debe ser un número entero' };
      }
      if (num < 0 || num > 150) {
        return { valid: false, error: 'Edad debe estar entre 0 y 150 años' };
      }
      return { valid: true };
    }),

  // Validación de observaciones
  observations: (value: string, fieldName: string = 'Observaciones'): ValidationResult => {
    if (value.length > 1000) {
      return { valid: false, error: `${fieldName} es demasiado largo` };
    }
    return { valid: true };
  },

  // Validación de drenaje vs infusión (coherencia básica)
  coherenceDrainageInfusion: (
    drainage: string,
    infusion: string
  ): ValidationResult => {
    const drainageNum = parseStrictNumber(drainage);
    const infusionNum = parseStrictNumber(infusion);

    if (drainageNum === null || infusionNum === null) {
      return { valid: true };
    }

    if (drainageNum <= 0) {
      return { valid: false, error: 'El drenaje debe ser mayor a 0' };
    }

    return { valid: true };
  },

  // Validación de coherencia para diálisis automatizada
  coherenceAutomated: (
    firstDrainage: string,
    infusion: string,
    drainage: string
  ): ValidationResult => {
    const pd = parseStrictNumber(firstDrainage);
    const inf = parseStrictNumber(infusion);
    const drain = parseStrictNumber(drainage);

    if (pd === null || inf === null || drain === null) {
      return { valid: true };
    }

    if (pd < 0) {
      return { valid: false, error: 'P.D no puede ser negativo' };
    }

    if (drain <= 0) {
      return { valid: false, error: 'Drenaje debe ser mayor a 0' };
    }

    return { valid: true };
  },
};

/**
 * Hook para manejar estado de validación de un campo
 */
export const useFieldValidation = (
  validator: (value: string) => ValidationResult
) => {
  const [value, setValue] = React.useState('');
  const [error, setError] = React.useState<string>();

  const handleChange = (text: string) => {
    setValue(text);
    const result = validator(text);
    setError(result.error);
  };

  return {
    value,
    setValue,
    error,
    setError,
    handleChange,
    isValid: !error && value.trim() !== '',
  };
};
