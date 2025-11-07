import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {
  Button,
  Text,
  TextInput,
  Card,
  Divider,
  IconButton,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BagType, DialysisRecord } from '../types/index.js';
import { saveRecord } from '../utils/storage';

const DEFAULT_INFUSION = 2000;

interface DialysisEntry {
  bagType: BagType;
  drainage: string;
  observations: string;
}

export const HomeScreen = ({ navigation }: { navigation: any }) => {
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [entries, setEntries] = useState<DialysisEntry[]>([
    { bagType: 1.5, drainage: '', observations: '' },
  ]);
  const [showConcentrationPicker, setShowConcentrationPicker] = useState<number | null>(null);

  const addEntry = () => {
    if (entries.length < 4) {
      setEntries([...entries, { bagType: 1.5, drainage: '', observations: '' }]);
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

  const calculateBalance = (drainage: string): number => {
    const drainageNum = parseFloat(drainage);
    return isNaN(drainageNum) ? 0 : drainageNum - DEFAULT_INFUSION;
  };

  const getTotalBalance = (): number => {
    return entries.reduce((sum, entry) => {
      return sum + calculateBalance(entry.drainage);
    }, 0);
  };

  const getBalanceColor = (balance: number): string => {
    if (balance > 0) return '#4CAF50'; // Verde
    if (balance < 0) return '#F44336'; // Rojo
    return '#757575'; // Gris
  };

  const saveEntries = async () => {
    try {
      for (const entry of entries) {
        if (!entry.drainage) {
          Alert.alert('Campo requerido', 'Por favor ingrese la cantidad de drenaje');
          return;
        }

        // Usar métodos UTC para evitar problemas de zona horaria
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const dateOnly = `${year}-${month}-${day}`;
        
        console.log('Fecha original:', date);
        console.log('Fecha formateada:', dateOnly);
        
        // Hora actual para el timestamp
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timestamp = `${dateOnly}T${hours}:${minutes}:${seconds}`;
        
        console.log('Timestamp final:', timestamp);

        const record: DialysisRecord = {
          id: Date.now().toString() + Math.random(), // Asegurar IDs únicos
          bagType: entry.bagType,
          infusion: DEFAULT_INFUSION,
          drainage: parseFloat(entry.drainage),
          balance: calculateBalance(entry.drainage),
          observations: entry.observations,
          timestamp: timestamp,
        };

        await saveRecord(record);
      }

      Alert.alert('Registro exitoso', 'Los datos han sido guardados correctamente');
      setEntries([{ bagType: 1.5, drainage: '', observations: '' }]);
    } catch (error) {
      Alert.alert('Error', 'Error al guardar los registros');
    }
  };

  const ConcentrationPicker = ({ index }: { index: number }) => {
    if (!entries[index]) return null;
    
    return (
      <Modal
        visible={showConcentrationPicker === index}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConcentrationPicker(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowConcentrationPicker(null)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Concentración</Text>
            <Divider style={styles.modalDivider} />
            {[1.5, 2.5, 4.5].map((concentration) => (
              <TouchableOpacity
                key={concentration}
                style={styles.modalOption}
                onPress={() => {
                  updateEntry(index, 'bagType', concentration as BagType);
                  setShowConcentrationPicker(null);
                }}
              >
                <Text style={styles.modalOptionText}>{concentration}%</Text>
                {entries[index].bagType === concentration && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

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
              console.log('Fecha seleccionada:', selectedDate);
              console.log('Fecha ISO:', selectedDate.toISOString());
              console.log('Fecha Local:', selectedDate.toLocaleDateString());
              setDate(selectedDate);
            }
          }}
        />
      )}

      {/* Sesiones de Diálisis */}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        💧 Sesiones de Diálisis
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
              >
                <Text style={styles.selectText}>{entry.bagType}%</Text>
                <Text style={styles.selectArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* Drenaje Input */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Drenaje (ml)</Text>
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
                  { color: getBalanceColor(calculateBalance(entry.drainage)) },
                ]}
              >
                {calculateBalance(entry.drainage) > 0 ? '+' : ''}
                {calculateBalance(entry.drainage)} ml
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

          <ConcentrationPicker index={index} />
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 12,
  },
  dateCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  dateContent: {
    paddingVertical: 12,
  },
  dateHeader: {
    marginBottom: 8,
  },
  dateLabel: {
    fontWeight: '600',
    color: '#1976D2',
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
    color: '#37474F',
  },
  sessionCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionNumber: {
    fontWeight: '600',
    color: '#1976D2',
  },
  deleteButton: {
    margin: 0,
  },
  divider: {
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#546E7A',
    marginBottom: 6,
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#B0BEC5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 50,
  },
  selectText: {
    fontSize: 16,
    color: '#263238',
    fontWeight: '500',
  },
  selectArrow: {
    fontSize: 12,
    color: '#78909C',
  },
  numericInput: {
    backgroundColor: '#FFFFFF',
    minHeight: 50,
  },
  inputContent: {
    paddingHorizontal: 8,
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ECEFF1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#546E7A',
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  observationsInput: {
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
  addButton: {
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
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
    color: '#546E7A',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '80%',
    maxWidth: 300,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#263238',
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
    color: '#263238',
  },
  checkmark: {
    fontSize: 20,
    color: '#1976D2',
    fontWeight: '700',
  },
});