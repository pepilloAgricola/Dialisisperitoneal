import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Button, Text, Card, Divider, IconButton } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BagType, DialysisRecord } from '../types/index';
import { saveRecord } from '../utils/storage';
import { useAppTheme } from '../utils/ThemeContext';
import { FormField } from '../components/FormField';
import { DatePickerCard } from '../components/DatePickerCard';
import { BalanceDisplay } from '../components/BalanceDisplay';
import { FadeInView } from '../components/FadeInView';
import { useToast, Toast } from '../components/Toast';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { validators } from '../utils/validators';
import { commonSpacing, commonRadius } from '../utils/themeStyles';

interface DialysisEntry {
  bagType: BagType;
  infusion: string;
  infusionError?: string;
  drainage: string;
  drainageError?: string;
  observations: string;
}

export const HomeScreen = ({ navigation }: { navigation: any }) => {
  const { theme } = useAppTheme();
  const toast = useToast();
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [entries, setEntries] = useState<DialysisEntry[]>([
    { bagType: 1.5, infusion: '2000', drainage: '', observations: '' },
  ]);
  const [showConcentrationPicker, setShowConcentrationPicker] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const addEntry = () => {
    if (entries.length < 4) {
      setEntries([...entries, { bagType: 1.5, infusion: '2000', drainage: '', observations: '' }]);
      toast.showToast(`Sesión ${entries.length + 1} añadida`, 'info');
    } else {
      toast.showToast('Máximo 4 sesiones diarias permitidas', 'warning');
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
    const infusionNum = Number(validators.normalizeNumericInput(infusion)) || 0;
    const drainageNum = Number(validators.normalizeNumericInput(drainage)) || 0;
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
    // Validar todos los campos primero
    let hasErrors = false;
    let globalError: string | undefined;
    const updatedEntries = entries.map((entry) => {
      const infusionVal = validators.positiveNumber(entry.infusion, 'Infusión');
      const drainageVal = validators.positiveNumber(entry.drainage, 'Drenaje');
      const coherenceVal = validators.coherenceDrainageInfusion(entry.drainage, entry.infusion);
      const observationsVal = validators.observations(entry.observations);

      if (!infusionVal.valid || !drainageVal.valid || !coherenceVal.valid || !observationsVal.valid) {
        hasErrors = true;
        if (!globalError) {
          globalError =
            infusionVal.error ||
            drainageVal.error ||
            coherenceVal.error ||
            observationsVal.error;
        }
      }

      return {
        ...entry,
        infusionError: infusionVal.error || (coherenceVal.valid ? undefined : coherenceVal.error),
        drainageError: drainageVal.error || (coherenceVal.valid ? undefined : coherenceVal.error),
      };
    });

    setEntries(updatedEntries);

    if (hasErrors) {
      toast.showToast(globalError || 'Por favor corrige los errores', 'error');
      return;
    }

    setLoading(true);
    try {
      for (const entry of entries) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateOnly = `${year}-${month}-${day}`;
        
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timestamp = `${dateOnly}T${hours}:${minutes}:${seconds}`;

        const infusionNum = Number(validators.normalizeNumericInput(entry.infusion));
        const drainageNum = Number(validators.normalizeNumericInput(entry.drainage));

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

        const saved = await saveRecord(record);
        if (!saved) {
          throw new Error('No se pudo guardar un registro');
        }
      }

      toast.showToast('✓ Registros guardados correctamente', 'success');
      setEntries([{ bagType: 1.5, infusion: '2000', drainage: '', observations: '' }]);
    } catch (error) {
      toast.showToast('Error al guardar los registros', 'error');
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(theme);

  return (
    <ScreenScaffold contentContainerStyle={styles.contentContainer}>
      <FadeInView delay={20} offsetY={8}>
        <View style={styles.headerBlock}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Registro CAPD
          </Text>
          <Text style={styles.headerSubtitle}>
            Añade tus intercambios del día y revisa el balance total antes de guardar.
          </Text>
        </View>
      </FadeInView>

      <FadeInView delay={40} offsetY={8}>
        <DatePickerCard 
          date={date}
          onPress={() => setShowDatePicker(true)}
          theme={theme}
          title="Fecha de sesión"
        />
      </FadeInView>

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

      {entries.map((entry, index) => (
        <FadeInView
          key={`entry-${index}`}
          delay={90 + index * 35}
          offsetY={10}
        >
          <Card style={styles.sessionCard} mode="elevated">
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

              <FormField 
                label="Infusión (ml)"
                value={entry.infusion}
                onChangeText={(value) => updateEntry(index, 'infusion', value)}
                error={entry.infusionError}
                keyboardType="numeric"
                placeholder="2000"
                theme={theme}
                icon="water-plus"
              />

              <FormField 
                label="Drenaje (ml)"
                value={entry.drainage}
                onChangeText={(value) => updateEntry(index, 'drainage', value)}
                error={entry.drainageError}
                keyboardType="numeric"
                placeholder="2000"
                theme={theme}
                icon="water-minus"
              />

              <View style={styles.balanceDisplayContainer}>
                <BalanceDisplay
                  balance={calculateBalance(entry.infusion, entry.drainage)}
                  label="Balance"
                  theme={theme}
                  size="medium"
                />
              </View>

              <FormField 
                label="Observaciones (opcional)"
                value={entry.observations}
                onChangeText={(value) => updateEntry(index, 'observations', value)}
                placeholder="Notas sobre la sesión..."
                multiline
                numberOfLines={3}
                theme={theme}
                icon="note-text-outline"
              />
            </Card.Content>
          </Card>
        </FadeInView>
      ))}

      <FadeInView delay={180} offsetY={10}>
        <Button
          mode="outlined"
          onPress={addEntry}
          disabled={entries.length >= 4 || loading}
          icon="plus"
          style={styles.addButton}
          contentStyle={styles.addButtonContent}
        >
          Añadir sesión {entries.length < 4 && `(${entries.length}/4)`}
        </Button>
      </FadeInView>

      <FadeInView delay={220} offsetY={10}>
        <Card style={[styles.totalCard, { backgroundColor: getBalanceColor(getTotalBalance()) + '18' }]}>
          <Card.Content style={styles.totalContent}>
            <BalanceDisplay
              balance={getTotalBalance()}
              label="Balance total del día"
              theme={theme}
              size="large"
            />
          </Card.Content>
        </Card>
      </FadeInView>

      <FadeInView delay={260} offsetY={10} style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={saveEntries}
          disabled={loading}
          loading={loading}
          icon="content-save-outline"
          style={styles.saveButton}
          contentStyle={styles.saveButtonContent}
          labelStyle={styles.saveButtonLabel}
        >
          Guardar registro
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('History')}
          disabled={loading}
          icon="history"
          style={styles.historyButton}
          contentStyle={styles.historyButtonContent}
        >
          Ver historial
        </Button>
      </FadeInView>

      <View style={styles.bottomSpacer} />

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
                <Text style={styles.modalTitle}>Seleccionar concentración</Text>
                <Divider style={styles.modalDivider} />
                {[1.5, 2.3, 4.25].map((concentration) => (
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

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        action={toast.action}
        onDismiss={toast.hideToast}
        theme={theme}
      />
    </ScreenScaffold>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  contentContainer: {
    paddingBottom: 26,
  },
  headerBlock: {
    marginBottom: 4,
  },
  headerTitle: {
    color: theme.colors.onBackground,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
    marginTop: 4,
  },
  sessionCard: {
    marginBottom: 12,
    borderRadius: 22,
    elevation: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionNumber: {
    fontWeight: '700',
    color: theme.colors.primary,
    fontSize: 17,
  },
  deleteButton: {
    margin: 0,
  },
  divider: {
    marginBottom: 14,
    backgroundColor: theme.colors.outlineVariant,
  },
  fieldContainer: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
    marginBottom: 6,
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  selectText: {
    fontSize: 16,
    color: theme.colors.onSurface,
    fontWeight: '600',
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
  balanceDisplayContainer: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 14,
    padding: commonSpacing.md,
    marginBottom: commonSpacing.md,
    alignItems: 'center',
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
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary,
  },
  addButtonContent: {
    height: 46,
  },
  totalCard: {
    marginBottom: 20,
    borderRadius: 22,
    elevation: 1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  totalContent: {
    alignItems: 'center',
    paddingVertical: 16,
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
    borderRadius: 16,
    elevation: 1,
  },
  saveButtonContent: {
    height: 50,
  },
  saveButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyButton: {
    borderRadius: 16,
    borderColor: theme.colors.primary,
  },
  historyButtonContent: {
    height: 50,
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
    borderRadius: 22,
    width: 300,
    padding: 20,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
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
