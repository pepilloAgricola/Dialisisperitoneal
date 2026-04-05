import React, { useState, useMemo, useCallback } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Button, Text, Card, Divider, TextInput, IconButton, Portal, Dialog, Chip } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { DialysisRecord } from '../types/index';
import { getAllRecords, updateRecord, deleteRecord } from '../utils/storage';
import { useAppTheme } from '../utils/ThemeContext';
import { FadeInView } from '../components/FadeInView';
import { useToast, Toast } from '../components/Toast';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { validators } from '../utils/validators';
import { commonSpacing, commonRadius } from '../utils/themeStyles';

const PD_REFERENCE_INFUSION = 2000;

export const HistoryScreen = ({ navigation }: { navigation: any }) => {
  const { theme } = useAppTheme();
  const toast = useToast();
  const [records, setRecords] = useState<DialysisRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  // Editing dialog
  const [editingRecord, setEditingRecord] = useState<DialysisRecord | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editDialogVisible, setEditDialogVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [])
  );

  const loadRecords = async () => {
    try {
      setLoading(true);
      const allRecordsMap = await getAllRecords();
      const allRecords: DialysisRecord[] = [];
      for (const dateKey in allRecordsMap) {
        allRecords.push(...allRecordsMap[dateKey].records);
      }
      allRecords.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecords(allRecords);
    } catch (error) {
      toast.showToast('Error al cargar historial', 'error');
    } finally {
      setLoading(false);
    }
  };

  const groupedByDate = useMemo(() => {
    const map: Record<string, DialysisRecord[]> = {};
    records.forEach((r) => {
      const key = r.timestamp.split('T')[0];
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return map;
  }, [records]);

  const dateKeys = useMemo(() => Object.keys(groupedByDate).sort((a, b) => (a > b ? -1 : 1)), [groupedByDate]);
  const dayTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    Object.entries(groupedByDate).forEach(([dateKey, dayRecords]) => {
      totals[dateKey] = dayRecords.reduce((sum, record) => sum + (record.balance || 0), 0);
    });
    return totals;
  }, [groupedByDate]);

  const filteredDateKeys = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return dateKeys;

    return dateKeys.filter((dateKey) => {
      const dateLabel = new Date(`${dateKey}T00:00:00`).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).toLowerCase();

      const recordsForDate = groupedByDate[dateKey] || [];
      const hasMatchInRecords = recordsForDate.some((record) => {
        const typeLabel = record.type === 'automated' ? 'automatizada apd' : 'manual capd';
        const observations = (record.observations || '').toLowerCase();
        return typeLabel.includes(query) || observations.includes(query);
      });

      return dateKey.includes(query) || dateLabel.includes(query) || hasMatchInRecords;
    });
  }, [dateKeys, groupedByDate, searchQuery]);

  const toggleDate = (dateKey: string) => {
    setExpandedDates((prev) => ({ ...prev, [dateKey]: !prev[dateKey] }));
  };

  const openEdit = (record: DialysisRecord) => {
    setEditingRecord(record);
    setEditForm({ ...record, // clone
      infusion: record.infusion?.toString?.() || '',
      drainage: record.drainage?.toString?.() || '',
      uf: (record as any).uf?.toString?.() || '',
      firstDrainage: (record as any).firstDrainage?.toString?.() || '',
      observations: record.observations || ''
    });
    setEditDialogVisible(true);
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    try {
      await deleteRecord(id);
      await loadRecords();
      toast.showToast('Registro eliminado', 'success');
    } catch (err) {
      toast.showToast('Error al eliminar registro', 'error');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    try {
      const infusionValidation = validators.positiveNumber(editForm.infusion || '', 'Infusión');
      const drainageValidation = validators.positiveNumber(editForm.drainage || '', 'Drenaje');
      const observationsValidation = validators.observations(editForm.observations || '');
      const manualCoherenceValidation = validators.coherenceDrainageInfusion(
        editForm.drainage || '',
        editForm.infusion || ''
      );

      let firstError =
        infusionValidation.error ||
        drainageValidation.error ||
        observationsValidation.error;

      if (editingRecord.type === 'manual') {
        firstError = firstError || manualCoherenceValidation.error;
      }

      if (editingRecord.type === 'automated') {
        const pdValidation = validators.nonNegativeNumber(editForm.firstDrainage || '', 'P.D');
        const ufValidation = validators.signedNumber(editForm.uf || '', 'UF');
        const automatedCoherenceValidation = validators.coherenceAutomated(
          editForm.firstDrainage || '',
          editForm.infusion || '',
          editForm.drainage || ''
        );

        firstError =
          firstError ||
          pdValidation.error ||
          ufValidation.error ||
          automatedCoherenceValidation.error;
      }

      if (firstError) {
        toast.showToast(firstError, 'error');
        return;
      }

      const updated: DialysisRecord = { ...editingRecord } as any;
      updated.infusion = Number(validators.normalizeNumericInput(editForm.infusion || '0'));
      updated.drainage = Number(validators.normalizeNumericInput(editForm.drainage || '0'));
      updated.observations = (editForm.observations || '').trim();
      if (editingRecord.type === 'automated') {
        const ufValue = Number(validators.normalizeNumericInput(editForm.uf || '0'));
        const firstDrainageValue = Number(validators.normalizeNumericInput(editForm.firstDrainage || '0'));
        const pdBalanceValue = PD_REFERENCE_INFUSION - firstDrainageValue;

        (updated as any).uf = ufValue;
        (updated as any).firstDrainage = firstDrainageValue;
        (updated as any).pdBalance = pdBalanceValue;
        updated.balance = pdBalanceValue + ufValue;
      } else if (editingRecord.type === 'manual') {
        // For manual, keep simple per-session balance
        updated.balance = updated.drainage - updated.infusion;
      }

      const ok = await updateRecord(updated);
      if (ok) {
        toast.showToast('Registro actualizado', 'success');
        setEditDialogVisible(false);
        setEditingRecord(null);
        await loadRecords();
      } else {
        toast.showToast('No se pudo actualizar', 'error');
      }
    } catch (err) {
      toast.showToast('Error al guardar cambios', 'error');
    }
  };

  const styles = createStyles(theme);
  const formatSignedBalance = (value: number) => `${value > 0 ? '+' : ''}${value.toLocaleString('es-ES')} ml`;

  if (loading) return (
    <View style={styles.loadingContainer}><Text>Cargando historial...</Text></View>
  );

  return (
    <ScreenScaffold contentContainerStyle={styles.contentContainer}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onDismiss={toast.hideToast} theme={theme} />

      <FadeInView delay={10} offsetY={6}>
        <View style={styles.headerBlock}>
          <Text style={styles.headerTitle}>Historial</Text>
          <Text style={styles.headerSubtitle}>Revisa y edita tus sesiones registradas</Text>
        </View>
      </FadeInView>

      <FadeInView delay={20} offsetY={8}>
        <Card style={styles.searchCard} mode="elevated">
          <Card.Content style={styles.searchContent}>
            <TextInput
              mode="outlined"
              placeholder="Buscar por fecha, tipo u observaciones..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              left={<TextInput.Icon icon="magnify" />}
              style={styles.searchBar}
              outlineStyle={styles.searchOutline}
            />
            <Text style={styles.resultsMeta}>
              {filteredDateKeys.length} {filteredDateKeys.length === 1 ? 'día encontrado' : 'días encontrados'}
            </Text>
          </Card.Content>
        </Card>
      </FadeInView>

      {filteredDateKeys.length === 0 && (
        <View style={styles.emptyState}>
          <Text variant="bodyLarge" style={styles.emptyText}>Sin registros para mostrar</Text>
          <Button mode="contained" onPress={() => navigation.navigate('Welcome')} style={styles.navigateButton}>Crear nuevo registro</Button>
        </View>
      )}

      {filteredDateKeys.map((dateKey, index) => (
        <FadeInView
          key={`date-${dateKey}`}
          delay={70 + index * 35}
          offsetY={10}
        >
          <Card style={styles.dayCard} mode="elevated">
            <TouchableOpacity onPress={() => toggleDate(dateKey)} activeOpacity={0.8}>
              <Card.Content>
                <View style={styles.dayHeaderRow}>
                  <View style={styles.dayInfo}>
                    <Text style={styles.dayTitle}>{new Date(`${dateKey}T00:00:00`).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                    <View style={styles.dayMetaRow}>
                      <Chip compact style={styles.metaChip} textStyle={styles.metaChipText}>
                        {groupedByDate[dateKey].length} {groupedByDate[dateKey].length === 1 ? 'sesión' : 'sesiones'}
                      </Chip>
                      <View style={styles.dayBalanceChip}>
                        <Text style={styles.dayBalanceLabel}>Balance total</Text>
                        <Text style={styles.dayBalanceValue}>{formatSignedBalance(dayTotals[dateKey] || 0)}</Text>
                      </View>
                    </View>
                  </View>
                  <IconButton
                    icon={expandedDates[dateKey] ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    iconColor={theme.colors.primary}
                    style={styles.expandIconButton}
                  />
                </View>
              </Card.Content>
            </TouchableOpacity>

            {expandedDates[dateKey] && (
              <Card.Content>
                {groupedByDate[dateKey].map((record) => (
                  <Card key={record.id} style={styles.recordCardInner} mode="outlined">
                    <Card.Content>
                      {(() => {
                        const pdBalance =
                          (record as any).pdBalance !== undefined
                            ? (record as any).pdBalance
                            : typeof (record as any).firstDrainage === 'number'
                              ? PD_REFERENCE_INFUSION - (record as any).firstDrainage
                              : 0;
                        const uf = (record as any).uf || 0;

                        return (
                          <>
                      <View style={styles.recordHeader}>
                        <View style={styles.recordInfo}>
                          <Text style={styles.recordType}>{record.type === 'automated' ? 'APD' : 'CAPD'}</Text>
                          <Text style={styles.recordDate}>{new Date(record.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</Text>
                        </View>
                        <View style={styles.recordActions}>
                          <IconButton icon="pencil-outline" size={20} onPress={() => openEdit(record)} />
                          <IconButton icon="delete-outline" size={20} onPress={() => handleDelete(record.id)} />
                        </View>
                      </View>

                      <Divider style={styles.divider} />

                      {record.type === 'automated' && (
                        <View style={styles.detailsSection}>
                          <Text style={styles.detailLabel}>P.D: <Text style={styles.detailValue}>{(record as any).firstDrainage || 0} ml</Text></Text>
                          <Text style={styles.detailLabel}>Balance P.D.: <Text style={styles.detailValue}>{pdBalance} ml</Text></Text>
                          <Text style={styles.detailLabel}>Infusión: <Text style={styles.detailValue}>{record.infusion || 0} ml</Text></Text>
                          <Text style={styles.detailLabel}>Drenaje: <Text style={styles.detailValue}>{record.drainage || 0} ml</Text></Text>
                          <Text style={styles.detailLabel}>UF: <Text style={styles.detailValue}>{uf} ml</Text></Text>
                        </View>
                      )}

                      {record.type === 'manual' && (
                        <View style={styles.entriesContainer}>
                          <Text style={styles.detailLabel}>Sesión: <Text style={styles.detailValue}>Inf: {record.infusion} ml | Dren: {record.drainage} ml</Text></Text>
                        </View>
                      )}

                      {record.observations ? (
                        <View style={styles.observationsSection}><Text style={styles.observationText}>{record.observations}</Text></View>
                      ) : null}
                          </>
                        );
                      })()}
                    </Card.Content>
                  </Card>
                ))}
              </Card.Content>
            )}
          </Card>
        </FadeInView>
      ))}

      <Portal>
        <Dialog visible={editDialogVisible} onDismiss={() => setEditDialogVisible(false)}>
          <Dialog.Title>Editar sesión</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {editingRecord?.type === 'automated' ? (
                <>
                  <View style={styles.dialogField}>
                    <Text style={styles.dialogFieldLabel}>P.D - Primer drenaje (ml)</Text>
                    <TextInput
                      value={editForm.firstDrainage}
                      onChangeText={(t) => setEditForm((s:any)=>({ ...s, firstDrainage: t }))}
                      keyboardType="numeric"
                      mode="flat"
                      placeholder="Ej: 2200"
                      style={styles.dialogInput}
                      underlineColor="transparent"
                      activeUnderlineColor="transparent"
                    />
                  </View>
                  <View style={styles.dialogField}>
                    <Text style={styles.dialogFieldLabel}>Infusión (ml)</Text>
                    <TextInput
                      value={editForm.infusion}
                      onChangeText={(t) => setEditForm((s:any)=>({ ...s, infusion: t }))}
                      keyboardType="numeric"
                      mode="flat"
                      placeholder="Ej: 8000"
                      style={styles.dialogInput}
                      underlineColor="transparent"
                      activeUnderlineColor="transparent"
                    />
                  </View>
                  <View style={styles.dialogField}>
                    <Text style={styles.dialogFieldLabel}>Drenaje (ml)</Text>
                    <TextInput
                      value={editForm.drainage}
                      onChangeText={(t) => setEditForm((s:any)=>({ ...s, drainage: t }))}
                      keyboardType="numeric"
                      mode="flat"
                      placeholder="Ej: 8800"
                      style={styles.dialogInput}
                      underlineColor="transparent"
                      activeUnderlineColor="transparent"
                    />
                  </View>
                  <View style={styles.dialogField}>
                    <Text style={styles.dialogFieldLabel}>UF (ml)</Text>
                    <TextInput
                      value={editForm.uf}
                      onChangeText={(t) => setEditForm((s:any)=>({ ...s, uf: t }))}
                      keyboardType="numeric"
                      mode="flat"
                      placeholder="Ej: -800"
                      style={styles.dialogInput}
                      underlineColor="transparent"
                      activeUnderlineColor="transparent"
                    />
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.dialogField}>
                    <Text style={styles.dialogFieldLabel}>Infusión (ml)</Text>
                    <TextInput
                      value={editForm.infusion}
                      onChangeText={(t) => setEditForm((s:any)=>({ ...s, infusion: t }))}
                      keyboardType="numeric"
                      mode="flat"
                      placeholder="Ej: 2000"
                      style={styles.dialogInput}
                      underlineColor="transparent"
                      activeUnderlineColor="transparent"
                    />
                  </View>
                  <View style={styles.dialogField}>
                    <Text style={styles.dialogFieldLabel}>Drenaje (ml)</Text>
                    <TextInput
                      value={editForm.drainage}
                      onChangeText={(t) => setEditForm((s:any)=>({ ...s, drainage: t }))}
                      keyboardType="numeric"
                      mode="flat"
                      placeholder="Ej: 2200"
                      style={styles.dialogInput}
                      underlineColor="transparent"
                      activeUnderlineColor="transparent"
                    />
                  </View>
                </>
              )}
              <View style={styles.dialogField}>
                <Text style={styles.dialogFieldLabel}>Observaciones</Text>
                <TextInput
                  value={editForm.observations}
                  onChangeText={(t) => setEditForm((s:any)=>({ ...s, observations: t }))}
                  multiline
                  numberOfLines={3}
                  mode="flat"
                  placeholder="Escribe una nota opcional"
                  style={styles.dialogInput}
                  underlineColor="transparent"
                  activeUnderlineColor="transparent"
                />
              </View>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setEditDialogVisible(false)}>Cancelar</Button>
            <Button onPress={handleSaveEdit}>Guardar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <View style={styles.bottomSpacer} />
    </ScreenScaffold>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingBottom: commonSpacing.xxxl,
  },
  headerBlock: {
    marginBottom: commonSpacing.md,
    paddingHorizontal: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.colors.onBackground,
    marginBottom: 2,
  },
  headerSubtitle: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
  },
  searchCard: {
    borderRadius: commonRadius.xxl,
    marginBottom: commonSpacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  searchContent: {
    paddingVertical: commonSpacing.sm,
  },
  searchBar: {
    marginBottom: commonSpacing.sm,
    backgroundColor: theme.colors.surface,
  },
  searchOutline: {
    borderRadius: commonRadius.xl,
  },
  resultsMeta: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
  },
  dayCard: {
    marginBottom: commonSpacing.md,
    borderRadius: commonRadius.xxl,
    elevation: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dayInfo: {
    flex: 1,
  },
  dayTitle: {
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'capitalize',
    fontSize: 21,
    marginBottom: commonSpacing.xs,
  },
  daySummary: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 14,
    marginTop: commonSpacing.xs,
  },
  dayMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: commonSpacing.sm,
    marginTop: commonSpacing.xs,
  },
  metaChip: {
    backgroundColor: theme.colors.surfaceVariant,
    borderColor: theme.colors.outlineVariant,
    borderWidth: 1,
  },
  metaChipText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '600',
  },
  dayBalanceChip: {
    backgroundColor: theme.colors.surfaceVariant,
    borderColor: theme.colors.outlineVariant,
    borderWidth: 1,
    borderRadius: commonRadius.xl,
    paddingHorizontal: commonSpacing.md,
    paddingVertical: commonSpacing.xs,
    justifyContent: 'center',
  },
  dayBalanceLabel: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  dayBalanceValue: {
    color: theme.colors.success,
    fontSize: 23,
    fontWeight: '800',
    lineHeight: 27,
  },
  expandIconButton: {
    margin: 0,
    marginLeft: 10,
  },
  recordCardInner: {
    marginBottom: commonSpacing.md,
    borderRadius: commonRadius.xl,
    padding: commonSpacing.sm,
    borderColor: theme.colors.outlineVariant,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: commonSpacing.md,
  },
  recordInfo: { flex: 1 },
  recordType: { 
    fontWeight: '700', 
    color: theme.colors.primary,
    fontSize: 18,
    marginBottom: commonSpacing.xs,
  },
  recordDate: { 
    color: theme.colors.onSurfaceVariant, 
    fontSize: 15,
    fontWeight: '500',
  },
  recordActions: { flexDirection: 'row', alignItems: 'center' },
  divider: { marginVertical: commonSpacing.md, backgroundColor: theme.colors.outlineVariant },
  detailsSection: { 
    backgroundColor: theme.colors.surfaceVariant, 
    borderRadius: commonRadius.lg, 
    padding: commonSpacing.md,
    marginTop: commonSpacing.md,
    gap: commonSpacing.sm,
  },
  detailLabel: {
    fontSize: 16,
    color: theme.colors.onSurface,
    marginBottom: commonSpacing.xs,
  },
  detailValue: { 
    fontWeight: '700', 
    color: theme.colors.primary,
    fontSize: 16,
  },
  entriesContainer: { 
    backgroundColor: theme.colors.surfaceVariant, 
    borderRadius: commonRadius.lg, 
    padding: commonSpacing.md,
    marginTop: commonSpacing.md,
  },
  observationsSection: { marginTop: commonSpacing.md },
  observationText: { 
    fontSize: 15,
    color: theme.colors.onSurface,
    lineHeight: 22,
  },
  dialogField: {
    marginBottom: commonSpacing.sm,
  },
  dialogFieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
    marginBottom: 6,
  },
  dialogInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: commonRadius.lg,
    overflow: 'hidden',
    minHeight: 52,
  },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 100 },
  emptyText: { color: theme.colors.outline, marginBottom: commonSpacing.lg, textAlign: 'center' },
  navigateButton: { borderRadius: commonRadius.xl },
  bottomSpacer: { height: commonSpacing.xl },
});
