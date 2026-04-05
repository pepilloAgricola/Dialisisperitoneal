import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, Card, Divider } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DialysisRecord } from '../types/index';
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

const PD_REFERENCE_INFUSION = 2000;

export const AutomatedDialysisScreen = ({ navigation }: { navigation: any }) => {
  const { theme } = useAppTheme();
  const toast = useToast();
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Campos con seguimiento de errores
  const [firstDrainage, setFirstDrainage] = useState('');
  const [firstDrainageError, setFirstDrainageError] = useState<string>();
  
  const [infusion, setInfusion] = useState('');
  const [infusionError, setInfusionError] = useState<string>();
  
  const [drainage, setDrainage] = useState('');
  const [drainageError, setDrainageError] = useState<string>();
  
  const [uf, setUF] = useState('');
  const [ufError, setUFError] = useState<string>();
  
  const [observations, setObservations] = useState('');
  const [loading, setLoading] = useState(false);

  const firstDrainageValue = Number(validators.normalizeNumericInput(firstDrainage));
  const pdBalance = !isNaN(firstDrainageValue) ? PD_REFERENCE_INFUSION - firstDrainageValue : null;

  const ufValue = Number(validators.normalizeNumericInput(uf));
  const signedUF = !isNaN(ufValue) && uf.trim() !== '' ? ufValue : null;
  const totalBalance = pdBalance !== null && signedUF !== null ? pdBalance + signedUF : null;

  const saveEntry = async () => {
    // Validar todos los campos
    const pdVal = validators.nonNegativeNumber(firstDrainage, 'P.D');
    const infVal = validators.positiveNumber(infusion, 'Infusión');
    const drainVal = validators.positiveNumber(drainage, 'Drenaje');
    const ufVal = validators.signedNumber(uf, 'UF');
    const coherenceVal = validators.coherenceAutomated(firstDrainage, infusion, drainage);
    const observationsVal = validators.observations(observations);

    setFirstDrainageError(pdVal.error);
    setInfusionError(infVal.error);
    setDrainageError(drainVal.error || (coherenceVal.valid ? undefined : coherenceVal.error));
    setUFError(ufVal.error);

    if (!pdVal.valid || !infVal.valid || !drainVal.valid || !ufVal.valid || !coherenceVal.valid || !observationsVal.valid) {
      toast.showToast(
        pdVal.error ||
          infVal.error ||
          drainVal.error ||
          ufVal.error ||
          coherenceVal.error ||
          observationsVal.error ||
          'Por favor corrige los errores',
        'error'
      );
      return;
    }

    setLoading(true);
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

      const firstDrainageNum = Number(validators.normalizeNumericInput(firstDrainage));
      const ufValue = Number(validators.normalizeNumericInput(uf));
      const pdBalanceValue = PD_REFERENCE_INFUSION - firstDrainageNum;
      const totalBalanceValue = pdBalanceValue + ufValue;

      const record: DialysisRecord = {
        id: Date.now().toString() + Math.random(),
        type: 'automated',
        bagType: 1.5,
        infusion: Number(validators.normalizeNumericInput(infusion)),
        drainage: Number(validators.normalizeNumericInput(drainage)),
        balance: totalBalanceValue,
        firstDrainage: firstDrainageNum,
        pdBalance: pdBalanceValue,
        uf: ufValue,
        observations: observations,
        timestamp: timestamp,
      };

      const saved = await saveRecord(record);
      if (!saved) {
        throw new Error('No se pudo guardar el registro');
      }

      toast.showToast('✓ Registro guardado correctamente', 'success');
      
      // Limpiar formulario
      setFirstDrainage('');
      setInfusion('');
      setDrainage('');
      setUF('');
      setObservations('');
      navigation.navigate('History');
    } catch (error) {
      toast.showToast('Error al guardar el registro', 'error');
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
            Registro APD
          </Text>
          <Text style={styles.headerSubtitle}>
            Completa los valores de la cicladora para calcular el balance de la sesión.
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

      <FadeInView delay={90} offsetY={12}>
        <Card style={styles.mainCard} mode="elevated">
          <Card.Content>
            <Text variant="titleSmall" style={styles.cardTitle}>
              Datos de la cicladora
            </Text>
            <Text variant="bodySmall" style={styles.cardSubtitle}>
              Usa los valores mostrados al finalizar el ciclo
            </Text>

            <Divider style={styles.divider} />

            <FormField 
              label="P.D - Primer drenaje (ml)"
              value={firstDrainage}
              onChangeText={setFirstDrainage}
              error={firstDrainageError}
              keyboardType="numeric"
              placeholder="0"
              theme={theme}
              icon="water-minus"
            />

            <FormField 
              label="INF - Infusión total (ml)"
              value={infusion}
              onChangeText={setInfusion}
              error={infusionError}
              keyboardType="numeric"
              placeholder="0"
              theme={theme}
              icon="water-plus"
            />

            <FormField 
              label="DREN - Drenaje total (ml)"
              value={drainage}
              onChangeText={setDrainage}
              error={drainageError}
              keyboardType="numeric"
              placeholder="0"
              theme={theme}
              icon="water-check"
            />

            <FormField 
              label="UF - Ultrafiltrado / Balance (ml)"
              value={uf}
              onChangeText={setUF}
              error={ufError}
              keyboardType="numeric"
              placeholder="0"
              theme={theme}
              icon="filter"
              helperText="Ingresa el valor con signo si corresponde (ej: -847)"
            />

            {pdBalance !== null && (
              <View style={styles.balanceDisplayContainer}>
                <BalanceDisplay
                  balance={pdBalance}
                  label={`Balance P.D. (ref ${PD_REFERENCE_INFUSION} ml)`}
                  theme={theme}
                  size="small"
                  polarity="inverted"
                />
              </View>
            )}

            {totalBalance !== null && (
              <View style={styles.balanceDisplayContainer}>
                <BalanceDisplay
                  balance={totalBalance}
                  label="Balance total de la sesión"
                  theme={theme}
                  size="medium"
                  polarity="inverted"
                />
              </View>
            )}

            <FormField 
              label="Observaciones (opcional)"
              value={observations}
              onChangeText={setObservations}
              multiline
              numberOfLines={3}
              placeholder="Notas sobre la sesión..."
              theme={theme}
              icon="note-text-outline"
            />
          </Card.Content>
        </Card>
      </FadeInView>

      <FadeInView delay={150} offsetY={12}>
        <Card style={styles.infoCard} mode="outlined">
          <Card.Content>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>ℹ</Text>
              <View style={styles.infoTextContainer}>
                <Text variant="bodySmall" style={styles.infoText}>
                  Verifica que los valores coincidan con la pantalla de la máquina al finalizar el ciclo.
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </FadeInView>

      <FadeInView delay={210} offsetY={10} style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={saveEntry}
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
    paddingBottom: commonSpacing.xxl,
  },
  headerBlock: {
    marginBottom: commonSpacing.xs,
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
  mainCard: {
    marginBottom: commonSpacing.lg,
    borderRadius: commonRadius.xxl,
    elevation: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  cardTitle: {
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: commonSpacing.xs,
  },
  cardSubtitle: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: commonSpacing.md,
  },
  divider: {
    marginBottom: commonSpacing.lg,
    backgroundColor: theme.colors.outlineVariant,
  },
  balanceDisplayContainer: {
    marginTop: commonSpacing.xs,
    marginBottom: commonSpacing.sm,
    paddingHorizontal: commonSpacing.sm,
    alignItems: 'center',
  },
  infoCard: {
    marginBottom: commonSpacing.xl,
    borderRadius: commonRadius.xxl,
    backgroundColor: theme.colors.primaryContainer + '30',
    borderColor: theme.colors.outlineVariant,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 24,
    marginRight: commonSpacing.md,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoText: {
    color: theme.colors.onSurface,
    lineHeight: 19,
  },
  actionButtons: {
    gap: commonSpacing.md,
    marginBottom: commonSpacing.md,
  },
  saveButton: {
    borderRadius: commonRadius.xxl,
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
    borderRadius: commonRadius.xxl,
    borderColor: theme.colors.primary,
  },
  historyButtonContent: {
    height: 50,
  },
  bottomSpacer: {
    height: commonSpacing.xl,
  },
});
