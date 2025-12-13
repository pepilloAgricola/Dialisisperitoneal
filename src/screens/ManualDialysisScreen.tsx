import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity, Modal } from 'react-native';
import { Button, Text, TextInput, Card, Divider, IconButton } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BagType, DialysisRecord } from '../types/index';
import { saveRecord } from '../utils/storage';
import { useAppTheme } from '../utils/ThemeContext';

interface DialysisEntry {
  bagType: BagType;
  infusion: string;
  drainage: string;
  observations: string;
}

export const HomeScreen = ({ navigation }: { navigation: any }) => {
  const { theme } = useAppTheme();
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [entries, setEntries] = useState<DialysisEntry[]>([
    { bagType: 1.5, infusion: '2000', drainage: '', observations: '' },
  ]);
  const [showConcentrationPicker, setShowConcentrationPicker] = useState<number | null>(null);

  const addEntry = () => {
    if (entries.length < 4) {
      setEntries([...entries, { bagType: 1.5, infusion: '2000', drainage: '', observations: '' }]);
    } else {
      Alert.alert('Límite alcanzado', 'Máximo 4 diálisis por día');
    }
  };

  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      const newEntries = entries.filter((_, i) => i !== index);
      setEntries(newEntries);
    }
  };

  const updateEntry = (index: number, field: keyof DialysisEntry, value: any) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setEntries(newEntries);
  };

  const calculateBalance = (infusion: string, drainage: string): number => {
    const infusionNum = parseFloat(infusion) || 0;
    const drainageNum = parseFloat(drainage) || 0;
    return drainageNum - infusionNum;
  };

  const getTotalBalance = (): number => {
    return entries.reduce((sum, entry) => {
      return sum + calculateBalance(entry.infusion, entry.drainage);
    }, 0);
  };

  const getBalanceColor = (balance: number): string => {
    if (balance > 0) return theme.colors.success;
    if (balance < 0) return theme.colors.error;
    return theme.colors.outline;
  };

  const saveEntries = async () => {
    try {
      for (const entry of entries) {
        if (!entry.infusion || !entry.drainage) {
          Alert.alert('Campos requeridos', 'Por favor ingrese infusión y drenaje');
          return;
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateOnly = `${year}-${month}-${day}`;
        
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timestamp = `${dateOnly}T${hours}:${minutes}:${seconds}`;

        const infusionNum = parseFloat(entry.infusion);
        const drainageNum = parseFloat(entry.drainage);

        const record: DialysisRecord = {
          id: Date.now().toString() + Math.random(),
          type: 'manual',
          bagType: entry.bagType,
          infusion: infusionNum,
          drainage: drainageNum,
          balance: drainageNum - infusionNum,
          observations: entry.observations,
          timestamp: timestamp,
        };

        await saveRecord(record);
      }

      Alert.alert('Registro exitoso', 'Los datos han sido guardados correctamente');
      setEntries([{ bagType: 1.5, infusion: '2000', drainage: '', observations: '' }]);
    } catch (error) {
      Alert.alert('Error', 'Error al guardar los registros');
    }
  };

  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container}>
      {/* Selector de Fecha */}
      <Card style={styles.dateCard}>
        <Card.Content style={styles.dateContent}>
          <View style={styles.dateHeader}>
            <Text variant="titleMedium" style={styles.dateLabel}>📅 Fecha</Text>
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

      {/* Sesiones de Diálisis */}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        💧 Sesiones de Diálisis Manual (CAPD)
      </Text>

      {entries.map((entry, index) => (
        <Card key={index} style={styles.sessionCard} mode="elevated">
          <Card.Content>
            <View style={styles.sessionHeader}>
              <Text variant="titleSmall" style={styles.sessionNumber}>
                Sesión {index + 1}
              </Text>
              {entries.length > 1 && (
                <IconButton
                  icon="close"
                  size={20}
                  onPress={() => removeEntry(index)}
                  style={styles.deleteButton}
                />
              )}
            </View>

            <Divider style={styles.divider} />

            {/* Concentración Selector */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Concentración</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowConcentrationPicker(index)}
                activeOpacity={0.7}
              >
                <Text style={styles.selectText}>{entry.bagType}%</Text>
                <Text style={styles.selectArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* Infusión Input - AHORA EDITABLE */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>💉 Infusión (ml)</Text>
              <TextInput
                value={entry.infusion}
                onChangeText={(value: string) => updateEntry(index, 'infusion', value)}
                keyboardType="numeric"
                placeholder="2000"
                mode="outlined"
                style={styles.numericInput}
                contentStyle={styles.inputContent}
              />
            </View>

            {/* Drenaje Input */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>🧪 Drenaje (ml)</Text>
              <TextInput
                value={entry.drainage}
                onChangeText={(value: string) => updateEntry(index, 'drainage', value)}
                keyboardType="numeric"
                placeholder="2000"
                mode="outlined"
                style={styles.numericInput}
                contentStyle={styles.inputContent}
              />
            </View>

            {/* Balance */}
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>⚖️ Balance</Text>
              <Text
                style={[
                  styles.balanceValue,
                  { color: getBalanceColor(calculateBalance(entry.infusion, entry.drainage)) },
                ]}
              >
                {calculateBalance(entry.infusion, entry.drainage) > 0 ? '+' : ''}
                {calculateBalance(entry.infusion, entry.drainage)} ml
              </Text>
            </View>

            {/* Observaciones */}
            <TextInput
              label="📝 Observaciones (opcional)"
              value={entry.observations}
              onChangeText={(value: string) => updateEntry(index, 'observations', value)}
              multiline
              numberOfLines={2}
              mode="outlined"
              style={styles.observationsInput}
            />
          </Card.Content>
        </Card>
      ))}

      {/* Botón Añadir Sesión */}
      <Button
        mode="outlined"
        onPress={addEntry}
        disabled={entries.length >= 4}
        icon="plus"
        style={styles.addButton}
        contentStyle={styles.addButtonContent}
      >
        Añadir Sesión {entries.length < 4 && `(${entries.length}/4)`}
      </Button>

      {/* Balance Total */}
      <Card style={[styles.totalCard, { backgroundColor: getBalanceColor(getTotalBalance()) + '15' }]}>
        <Card.Content style={styles.totalContent}>
          <Text variant="titleSmall" style={styles.totalLabel}>
            Balance Total del Día
          </Text>
          <Text
            variant="displaySmall"
            style={[styles.totalValue, { color: getBalanceColor(getTotalBalance()) }]}
          >
            {getTotalBalance() > 0 ? '+' : ''}
            {getTotalBalance()} ml
          </Text>
        </Card.Content>
      </Card>

      {/* Botones de Acción */}
      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={saveEntries}
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

      {/* Modal de Concentración */}
      {showConcentrationPicker !== null && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowConcentrationPicker(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowConcentrationPicker(null)}
          >
            <TouchableOpacity 
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Seleccionar Concentración</Text>
                <Divider style={styles.modalDivider} />
                {[1.5, 2.5, 4.5].map((concentration) => (
                  <TouchableOpacity
                    key={concentration}
                    style={styles.modalOption}
                    onPress={() => {
                      updateEntry(showConcentrationPicker, 'bagType', concentration as BagType);
                      setShowConcentrationPicker(null);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalOptionText}>{concentration}%</Text>
                    {entries[showConcentrationPicker]?.bagType === concentration && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
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
  sessionCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 3,
    backgroundColor: theme.colors.surface,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionNumber: {
    fontWeight: '600',
    color: theme.colors.primary,
  },
  deleteButton: {
    margin: 0,
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
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 50,
  },
  selectText: {
    fontSize: 16,
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  selectArrow: {
    fontSize: 12,
    color: theme.colors.outline,
  },
  numericInput: {
    backgroundColor: theme.colors.surface,
    minHeight: 50,
  },
  inputContent: {
    paddingHorizontal: 8,
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
    marginTop: 4,
  },
  addButton: {
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary,
  },
  addButtonContent: {
    paddingVertical: 8,
  },
  totalCard: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 4,
  },
  totalContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  totalLabel: {
    fontWeight: '600',
    color: theme.colors.outline,
    marginBottom: 8,
  },
  totalValue: {
    fontWeight: '800',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    width: 300,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDivider: {
    marginBottom: 12,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  modalOptionText: {
    fontSize: 16,
    color: theme.colors.onSurface,
  },
  checkmark: {
    fontSize: 20,
    color: theme.colors.primary,
    fontWeight: '700',
  },
});