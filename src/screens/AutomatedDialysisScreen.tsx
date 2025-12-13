import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Button, Text, TextInput, Card, Divider } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DialysisRecord } from '../types/index';
import { saveRecord } from '../utils/storage';
import { useAppTheme } from '../utils/ThemeContext';

export const AutomatedDialysisScreen = ({ navigation }: { navigation: any }) => {
  const { theme } = useAppTheme();
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Campos según la máquina
  const [firstDrainage, setFirstDrainage] = useState(''); // P.D
  const [infusion, setInfusion] = useState(''); // INF
  const [drainage, setDrainage] = useState(''); // DREN
  const [uf, setUF] = useState(''); // UF (ultrafiltrado) - Este ES el balance
  const [observations, setObservations] = useState('');

  const getBalanceColor = (balance: number): string => {
    if (balance > 0) return theme.colors.success;
    if (balance < 0) return theme.colors.error;
    return theme.colors.outline;
  };

  const saveEntry = async () => {
    // Validaciones
    if (!firstDrainage || !infusion || !drainage || !uf) {
      Alert.alert('Campos requeridos', 'Por favor complete todos los campos: P.D, Infusión, Drenaje y UF');
      return;
    }

    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateOnly = `${year}-${month}-${day}`;
      
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const timestamp = `${dateOnly}T${hours}:${minutes}:${seconds}`;

      const ufValue = parseFloat(uf);

      const record: DialysisRecord = {
        id: Date.now().toString() + Math.random(),
        type: 'automated',
        bagType: 1.5, // No aplica para APD, pero requerido por el tipo
        infusion: parseFloat(infusion),
        drainage: parseFloat(drainage),
        balance: ufValue, // El balance ES el UF
        firstDrainage: parseFloat(firstDrainage),
        uf: ufValue,
        observations: observations,
        timestamp: timestamp,
      };

      await saveRecord(record);

      Alert.alert('Registro exitoso', 'Los datos han sido guardados correctamente');
      
      // Limpiar formulario
      setFirstDrainage('');
      setInfusion('');
      setDrainage('');
      setUF('');
      setObservations('');
    } catch (error) {
      Alert.alert('Error', 'Error al guardar el registro');
    }
  };

  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container}>
      {/* Selector de Fecha */}
      <Card style={styles.dateCard}>
        <Card.Content style={styles.dateContent}>
          <View style={styles.dateHeader}>
            <Text variant="titleMedium" style={styles.dateLabel}>📅 Fecha de la Sesión</Text>
          </View>
          <Button
            mode="contained-tonal"
            onPress={() => setShowDatePicker(true)}
            style={styles.dateButton}
            contentStyle={styles.dateButtonContent}
          >
            {date.toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Button>
        </Card.Content>
      </Card>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(event: any, selectedDate?: Date) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setDate(selectedDate);
            }
          }}
        />
      )}

      {/* Título */}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        🤖 Diálisis Automatizada (APD)
      </Text>

      {/* Tarjeta Principal */}
      <Card style={styles.mainCard} mode="elevated">
        <Card.Content>
          <Text variant="titleSmall" style={styles.cardTitle}>
            Datos de la Máquina
          </Text>
          <Text variant="bodySmall" style={styles.cardSubtitle}>
            Ingrese los valores mostrados al finalizar el ciclo
          </Text>

          <Divider style={styles.divider} />

          {/* P.D (Primer Drenaje) */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>💧 P.D - Primer Drenaje (ml)</Text>
            <TextInput
              value={firstDrainage}
              onChangeText={setFirstDrainage}
              keyboardType="numeric"
              placeholder="0"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="water-minus" />}
            />
          </View>

          {/* INF (Infusión Total) */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>💉 INF - Infusión Total (ml)</Text>
            <TextInput
              value={infusion}
              onChangeText={setInfusion}
              keyboardType="numeric"
              placeholder="0"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="water-plus" />}
            />
          </View>

          {/* DREN (Drenaje Total) */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>🧪 DREN - Drenaje Total (ml)</Text>
            <TextInput
              value={drainage}
              onChangeText={setDrainage}
              keyboardType="numeric"
              placeholder="0"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="water-check" />}
            />
          </View>

          {/* UF (Ultrafiltrado) - Este ES el balance */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>💧 UF - Ultrafiltrado/Balance (ml)</Text>
            <TextInput
              value={uf}
              onChangeText={setUF}
              keyboardType="numeric"
              placeholder="0"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="filter" />}
            />
            <Text style={styles.helpText}>
              Líquido eliminado durante la sesión (este es tu balance)
            </Text>
          </View>

          {/* Visualización del Balance (mismo valor que UF) */}
          {uf !== '' && !isNaN(parseFloat(uf)) && (
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>⚖️ Balance de la Sesión</Text>
              <Text
                style={[
                  styles.balanceValue,
                  { color: getBalanceColor(parseFloat(uf)) },
                ]}
              >
                {parseFloat(uf) > 0 ? '+' : ''}
                {parseFloat(uf)} ml
              </Text>
            </View>
          )}

          {/* Observaciones */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>📝 Observaciones (opcional)</Text>
            <TextInput
              value={observations}
              onChangeText={setObservations}
              multiline
              numberOfLines={3}
              mode="outlined"
              placeholder="Notas sobre la sesión..."
              style={styles.observationsInput}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Card Informativa */}
      <Card style={styles.infoCard} mode="outlined">
        <Card.Content>
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <View style={styles.infoTextContainer}>
              <Text variant="bodySmall" style={styles.infoText}>
                Los valores deben coincidir con los mostrados en la pantalla de su máquina de diálisis automatizada al finalizar el ciclo. El UF (ultrafiltrado) representa el balance total de la sesión.
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Botones de Acción */}
      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={saveEntry}
          icon="content-save"
          style={styles.saveButton}
          contentStyle={styles.saveButtonContent}
          labelStyle={styles.saveButtonLabel}
        >
          Guardar Registro
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('History')}
          icon="history"
          style={styles.historyButton}
          contentStyle={styles.historyButtonContent}
        >
          Ver Historial
        </Button>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 12,
  },
  dateCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: theme.colors.surface,
  },
  dateContent: {
    paddingVertical: 12,
  },
  dateHeader: {
    marginBottom: 8,
  },
  dateLabel: {
    fontWeight: '600',
    color: theme.colors.primary,
  },
  dateButton: {
    borderRadius: 8,
  },
  dateButtonContent: {
    paddingVertical: 6,
  },
  sectionTitle: {
    marginBottom: 12,
    marginTop: 4,
    fontWeight: '600',
    color: theme.colors.onBackground,
  },
  mainCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 3,
    backgroundColor: theme.colors.surface,
  },
  cardTitle: {
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  cardSubtitle: {
    color: theme.colors.outline,
    marginBottom: 12,
  },
  divider: {
    marginBottom: 16,
    backgroundColor: theme.colors.outline,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.outline,
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.colors.surface,
  },
  helpText: {
    fontSize: 11,
    color: theme.colors.outline,
    fontStyle: 'italic',
    marginTop: 4,
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  observationsInput: {
    backgroundColor: theme.colors.surface,
  },
  infoCard: {
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryContainer + '40',
    borderColor: theme.colors.primary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoText: {
    color: theme.colors.onSurface,
    lineHeight: 18,
  },
  actionButtons: {
    gap: 12,
    marginBottom: 8,
  },
  saveButton: {
    borderRadius: 10,
    elevation: 3,
  },
  saveButtonContent: {
    paddingVertical: 10,
  },
  saveButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyButton: {
    borderRadius: 10,
    borderColor: theme.colors.primary,
  },
  historyButtonContent: {
    paddingVertical: 10,
  },
  bottomSpacer: {
    height: 20,
  },
});