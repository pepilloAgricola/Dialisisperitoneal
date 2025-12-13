import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Card, Searchbar, Text, Chip, Divider, IconButton, Portal, Dialog, Button, TextInput } from 'react-native-paper';
import { DailyRecord, DialysisRecord, BagType } from '../types/index.js';
import { getAllRecords, deleteRecord, updateRecord } from '../utils/storage';
import { useAppTheme } from '../utils/ThemeContext';

export const HistoryScreen = () => {
  const { theme } = useAppTheme();
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecords, setFilteredRecords] = useState<DailyRecord[]>([]);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  
  const [editingRecord, setEditingRecord] = useState<DialysisRecord | null>(null);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [editFormData, setEditFormData] = useState({
    bagType: 1.5 as BagType,
    infusion: '',
    drainage: '',
    observations: '',
    firstDrainage: '',
    uf: '',
  });

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    const allRecords = await getAllRecords();
    const recordsArray = Object.values(allRecords);
    recordsArray.sort((a: DailyRecord, b: DailyRecord) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setRecords(recordsArray);
    setFilteredRecords(recordsArray);
  };

  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      const filtered = records.filter((record: DailyRecord) =>
        record.date.includes(query) ||
        new Date(record.date).toLocaleDateString('es-ES').includes(query)
      );
      setFilteredRecords(filtered);
    } else {
      setFilteredRecords(records);
    }
  };

  const toggleDay = (date: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDays(newExpanded);
  };

  const handleDeleteSession = (record: DialysisRecord) => {
    Alert.alert(
      'Eliminar Sesión',
      '¿Estás seguro de que deseas eliminar esta sesión de diálisis?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecord(record.id);
              await loadRecords();
              Alert.alert('Éxito', 'Sesión eliminada correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la sesión');
            }
          }
        }
      ]
    );
  };

  const handleEditSession = (record: DialysisRecord) => {
    setEditingRecord(record);
    setEditFormData({
      bagType: record.bagType,
      infusion: record.infusion.toString(),
      drainage: record.drainage.toString(),
      observations: record.observations || '',
      firstDrainage: record.firstDrainage?.toString() || '',
      uf: record.uf?.toString() || '',
    });
    setEditDialogVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;

    if (editingRecord.type === 'manual') {
      if (!editFormData.infusion || !editFormData.drainage) {
        Alert.alert('Campos requeridos', 'Por favor ingrese infusión y drenaje');
        return;
      }
    } else {
      if (!editFormData.firstDrainage || !editFormData.infusion || !editFormData.drainage || !editFormData.uf) {
        Alert.alert('Campos requeridos', 'Por favor complete todos los campos');
        return;
      }
    }

    const infusion = parseFloat(editFormData.infusion);
    const drainage = parseFloat(editFormData.drainage);

    if (isNaN(infusion) || isNaN(drainage)) {
      Alert.alert('Error', 'Los valores deben ser números válidos');
      return;
    }

    const balance = drainage - infusion;

    const updatedRecord: DialysisRecord = {
      ...editingRecord,
      bagType: editFormData.bagType,
      infusion: infusion,
      drainage: drainage,
      balance: balance,
      observations: editFormData.observations,
      firstDrainage: editFormData.firstDrainage ? parseFloat(editFormData.firstDrainage) : undefined,
      uf: editFormData.uf ? parseFloat(editFormData.uf) : undefined,
    };

    try {
      await updateRecord(updatedRecord);
      await loadRecords();
      setEditDialogVisible(false);
      setEditingRecord(null);
      Alert.alert('Éxito', 'Sesión actualizada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la sesión');
    }
  };

  const getBalanceColor = (balance: number): string => {
    if (balance > 0) return theme.colors.success;
    if (balance < 0) return theme.colors.error;
    return theme.colors.outline;
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'UTC'
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          📊 Historial de Diálisis
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {filteredRecords.length} {filteredRecords.length === 1 ? 'día' : 'días'} registrados
        </Text>
      </View>

      <Searchbar
        placeholder="Buscar por fecha..."
        onChangeText={onChangeSearch}
        value={searchQuery}
        style={styles.searchBar}
        iconColor={theme.colors.primary}
        elevation={2}
      />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {filteredRecords.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Text variant="displaySmall" style={styles.emptyIcon}>📋</Text>
              <Text variant="titleLarge" style={styles.emptyTitle}>
                No hay registros
              </Text>
              <Text variant="bodyMedium" style={styles.emptyText}>
                {searchQuery 
                  ? 'No se encontraron resultados para tu búsqueda'
                  : 'Aún no has registrado ninguna sesión de diálisis'}
              </Text>
            </Card.Content>
          </Card>
        ) : (
          filteredRecords.map((dailyRecord: DailyRecord) => {
            const isExpanded = expandedDays.has(dailyRecord.date);
            
            return (
              <Card key={dailyRecord.date} style={styles.dayCard} mode="elevated">
                <TouchableOpacity 
                  onPress={() => toggleDay(dailyRecord.date)}
                  activeOpacity={0.7}
                >
                  <Card.Content>
                    <View style={styles.collapsedView}>
                      <View style={styles.dayHeaderRow}>
                        <View style={styles.dayInfo}>
                          <Text variant="titleMedium" style={styles.dayTitle}>
                            📅 {formatDate(dailyRecord.date)}
                          </Text>
                          <View style={styles.summaryRow}>
                            <Chip 
                              icon="water" 
                              style={styles.sessionsChip}
                              textStyle={styles.chipText}
                            >
                              {dailyRecord.records.length} {dailyRecord.records.length === 1 ? 'sesión' : 'sesiones'}
                            </Chip>
                          </View>
                        </View>
                        <Text style={styles.expandIcon}>
                          {isExpanded ? '▲' : '▼'}
                        </Text>
                      </View>

                      <View style={styles.balanceSummary}>
                        <Text style={styles.balanceSummaryLabel}>Balance Total</Text>
                        <Text 
                          style={[
                            styles.balanceSummaryValue,
                            { color: getBalanceColor(dailyRecord.totalBalance) }
                          ]}
                        >
                          {dailyRecord.totalBalance > 0 ? '+' : ''}
                          {dailyRecord.totalBalance} ml
                        </Text>
                      </View>
                    </View>

                    {isExpanded && (
                      <>
                        <Divider style={styles.expandDivider} />
                        
                        <Text variant="titleSmall" style={styles.sessionsTitle}>
                          💧 Sesiones del Día
                        </Text>

                        {dailyRecord.records.map((record: any, index: number) => (
                          <Card 
                            key={record.id} 
                            style={styles.sessionCard}
                            mode="outlined"
                          >
                            <Card.Content>
                              <View style={styles.sessionHeader}>
                                <View style={styles.sessionTitleRow}>
                                  <Chip 
                                    style={styles.sessionBadge}
                                    textStyle={styles.sessionBadgeText}
                                  >
                                    #{index + 1}
                                  </Chip>
                                  <Chip 
                                    style={record.type === 'manual' ? styles.manualChip : styles.automatedChip}
                                    textStyle={styles.typeChipText}
                                    icon={record.type === 'manual' ? 'hand-back-right' : 'robot'}
                                  >
                                    {record.type === 'manual' ? 'Manual' : 'APD'}
                                  </Chip>
                                  <Text style={styles.sessionTime}>
                                    🕐 {formatTime(record.timestamp)}
                                  </Text>
                                </View>
                                <View style={styles.sessionActions}>
                                  {record.type === 'manual' && (
                                    <Chip 
                                      style={styles.concentrationChip}
                                      textStyle={styles.concentrationText}
                                    >
                                      {record.bagType}%
                                    </Chip>
                                  )}
                                  <IconButton
                                    icon="pencil"
                                    size={20}
                                    iconColor={theme.colors.primary}
                                    onPress={() => handleEditSession(record)}
                                    style={styles.actionButton}
                                  />
                                  <IconButton
                                    icon="delete"
                                    size={20}
                                    iconColor={theme.colors.error}
                                    onPress={() => handleDeleteSession(record)}
                                    style={styles.actionButton}
                                  />
                                </View>
                              </View>

                              <View style={styles.sessionData}>
                                {record.type === 'automated' && record.firstDrainage && (
                                  <View style={styles.dataItem}>
                                    <Text style={styles.dataLabel}>P.D (Primer Drenaje)</Text>
                                    <Text style={styles.dataValue}>{record.firstDrainage} ml</Text>
                                  </View>
                                )}

                                <View style={styles.dataRow}>
                                  <View style={styles.dataItem}>
                                    <Text style={styles.dataLabel}>💉 Infusión</Text>
                                    <Text style={styles.dataValue}>{record.infusion} ml</Text>
                                  </View>
                                  <View style={styles.dataItem}>
                                    <Text style={styles.dataLabel}>🧪 Drenaje</Text>
                                    <Text style={styles.dataValue}>{record.drainage} ml</Text>
                                  </View>
                                </View>

                                {record.type === 'automated' && record.uf && (
                                  <View style={styles.ufContainer}>
                                    <Text style={styles.ufLabel}>💧 UF (Ultrafiltrado)</Text>
                                    <Text style={styles.ufValue}>{record.uf} ml</Text>
                                  </View>
                                )}

                                <View style={styles.balanceRow}>
                                  <Text style={styles.balanceLabel}>⚖️ Balance</Text>
                                  <Text 
                                    style={[
                                      styles.balanceValue,
                                      { color: getBalanceColor(record.balance) }
                                    ]}
                                  >
                                    {record.balance > 0 ? '+' : ''}
                                    {record.balance} ml
                                  </Text>
                                </View>
                              </View>

                              {record.observations && (
                                <View style={styles.observationContainer}>
                                  <Text style={styles.observationLabel}>📝 Observaciones</Text>
                                  <Text style={styles.observationText}>
                                    {record.observations}
                                  </Text>
                                </View>
                              )}
                            </Card.Content>
                          </Card>
                        ))}
                      </>
                    )}
                  </Card.Content>
                </TouchableOpacity>
              </Card>
            );
          })
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Dialog de Edición */}
      <Portal>
        <Dialog visible={editDialogVisible} onDismiss={() => setEditDialogVisible(false)}>
          <Dialog.Title>Editar Sesión</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView>
              {editingRecord?.type === 'manual' && (
                <>
                  <Text style={styles.dialogLabel}>Concentración</Text>
                  <View style={styles.concentrationButtons}>
                    {[1.5, 2.5, 4.5].map((concentration) => (
                      <Chip
                        key={concentration}
                        selected={editFormData.bagType === concentration}
                        onPress={() => setEditFormData({ ...editFormData, bagType: concentration as BagType })}
                        style={[
                          styles.concentrationOption,
                          editFormData.bagType === concentration && styles.concentrationOptionSelected
                        ]}
                        textStyle={styles.concentrationOptionText}
                      >
                        {concentration}%
                      </Chip>
                    ))}
                  </View>
                </>
              )}

              {editingRecord?.type === 'automated' && (
                <TextInput
                  label="P.D - Primer Drenaje (ml)"
                  value={editFormData.firstDrainage}
                  onChangeText={(value) => setEditFormData({ ...editFormData, firstDrainage: value })}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.dialogInput}
                />
              )}

              <TextInput
                label="Infusión (ml)"
                value={editFormData.infusion}
                onChangeText={(value) => setEditFormData({ ...editFormData, infusion: value })}
                keyboardType="numeric"
                mode="outlined"
                style={styles.dialogInput}
              />

              <TextInput
                label="Drenaje (ml)"
                value={editFormData.drainage}
                onChangeText={(value) => setEditFormData({ ...editFormData, drainage: value })}
                keyboardType="numeric"
                mode="outlined"
                style={styles.dialogInput}
              />

              {editingRecord?.type === 'automated' && (
                <TextInput
                  label="UF - Ultrafiltrado (ml)"
                  value={editFormData.uf}
                  onChangeText={(value) => setEditFormData({ ...editFormData, uf: value })}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.dialogInput}
                />
              )}

              <TextInput
                label="Observaciones (opcional)"
                value={editFormData.observations}
                onChangeText={(value) => setEditFormData({ ...editFormData, observations: value })}
                multiline
                numberOfLines={3}
                mode="outlined"
                style={styles.dialogInput}
              />
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setEditDialogVisible(false)}>Cancelar</Button>
            <Button onPress={handleSaveEdit}>Guardar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontWeight: '700',
    color: theme.colors.onBackground,
    marginBottom: 4,
  },
  subtitle: {
    color: theme.colors.outline,
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: theme.colors.surface,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyCard: {
    marginTop: 40,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: theme.colors.surface,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  emptyText: {
    color: theme.colors.outline,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  dayCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 3,
    backgroundColor: theme.colors.surface,
  },
  collapsedView: {
    gap: 12,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dayInfo: {
    flex: 1,
    gap: 8,
  },
  dayTitle: {
    fontWeight: '700',
    color: theme.colors.primary,
    textTransform: 'capitalize',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sessionsChip: {
    backgroundColor: theme.colors.primaryContainer,
  },
  chipText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  expandIcon: {
    fontSize: 20,
    color: theme.colors.primary,
    fontWeight: '700',
    marginLeft: 12,
  },
  balanceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    padding: 16,
    borderRadius: 10,
  },
  balanceSummaryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  balanceSummaryValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  expandDivider: {
    marginVertical: 16,
    backgroundColor: theme.colors.outline,
  },
  sessionsTitle: {
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 12,
  },
  sessionCard: {
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  sessionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  sessionBadge: {
    backgroundColor: theme.colors.primary,
    height: 28,
  },
  sessionBadgeText: {
    fontSize: 12,
    color: theme.colors.onPrimary,
    fontWeight: '700',
  },
  manualChip: {
    backgroundColor: theme.colors.secondaryContainer,
    height: 28,
  },
  automatedChip: {
    backgroundColor: theme.colors.tertiaryContainer,
    height: 28,
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sessionTime: {
    fontSize: 14,
    color: theme.colors.outline,
    fontWeight: '500',
  },
  sessionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  concentrationChip: {
    backgroundColor: theme.colors.warningContainer || '#FFF3E0',
    height: 28,
  },
  concentrationText: {
    fontSize: 12,
    color: theme.colors.warning,
    fontWeight: '700',
  },
  actionButton: {
    margin: 0,
  },
  sessionData: {
    gap: 12,
  },
  dataRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dataItem: {
    flex: 1,
    backgroundColor: theme.colors.surfaceVariant,
    padding: 12,
    borderRadius: 8,
  },
  dataLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
    marginBottom: 4,
  },
  dataValue: {
    fontSize: 16,
    color: theme.colors.onSurface,
    fontWeight: '600',
  },
  ufContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer,
    padding: 12,
    borderRadius: 8,
  },
  ufLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onPrimaryContainer,
  },
  ufValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    padding: 12,
    borderRadius: 8,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  observationContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: theme.colors.warningContainer || '#FFF9C4',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.warning,
  },
  observationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.warning,
    marginBottom: 4,
  },
  observationText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 20,
  },
  dialogLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 8,
    marginTop: 8,
  },
  concentrationButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  concentrationOption: {
    flex: 1,
  },
  concentrationOptionSelected: {
    backgroundColor: theme.colors.primary,
  },
  concentrationOptionText: {
    fontWeight: '600',
  },
  dialogInput: {
    marginBottom: 12,
  },
});