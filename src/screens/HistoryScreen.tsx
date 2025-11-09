import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Card, Searchbar, Text, Chip, Divider, IconButton, Portal, Dialog, Button, TextInput } from 'react-native-paper';
import { DailyRecord, DialysisRecord, BagType } from '../types/index.js';
import { getAllRecords, deleteRecord, updateRecord } from '../utils/storage';

export const HistoryScreen = () => {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecords, setFilteredRecords] = useState<DailyRecord[]>([]);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  
  // Estados para edición
  const [editingRecord, setEditingRecord] = useState<DialysisRecord | null>(null);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [editFormData, setEditFormData] = useState({
    bagType: 1.5 as BagType,
    drainage: '',
    observations: ''
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
      drainage: record.drainage.toString(),
      observations: record.observations || ''
    });
    setEditDialogVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;

    if (!editFormData.drainage) {
      Alert.alert('Campo requerido', 'Por favor ingrese la cantidad de drenaje');
      return;
    }

    const drainage = parseFloat(editFormData.drainage);
    if (isNaN(drainage)) {
      Alert.alert('Error', 'La cantidad de drenaje debe ser un número válido');
      return;
    }

    const balance = drainage - editingRecord.infusion;

    const updatedRecord: DialysisRecord = {
      ...editingRecord,
      bagType: editFormData.bagType,
      drainage: drainage,
      balance: balance,
      observations: editFormData.observations
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
    if (balance > 0) return '#4CAF50';
    if (balance < 0) return '#F44336';
    return '#757575';
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
        iconColor="#1976D2"
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
                                  <Text style={styles.sessionTime}>
                                    🕐 {formatTime(record.timestamp)}
                                  </Text>
                                </View>
                                <View style={styles.sessionActions}>
                                  <Chip 
                                    style={styles.concentrationChip}
                                    textStyle={styles.concentrationText}
                                  >
                                    {record.bagType}%
                                  </Chip>
                                  <IconButton
                                    icon="pencil"
                                    size={20}
                                    iconColor="#1976D2"
                                    onPress={() => handleEditSession(record)}
                                    style={styles.actionButton}
                                  />
                                  <IconButton
                                    icon="delete"
                                    size={20}
                                    iconColor="#F44336"
                                    onPress={() => handleDeleteSession(record)}
                                    style={styles.actionButton}
                                  />
                                </View>
                              </View>

                              <View style={styles.sessionData}>
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
          <Dialog.Content>
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

            <TextInput
              label="Drenaje (ml)"
              value={editFormData.drainage}
              onChangeText={(value) => setEditFormData({ ...editFormData, drainage: value })}
              keyboardType="numeric"
              mode="outlined"
              style={styles.dialogInput}
            />

            <TextInput
              label="Observaciones (opcional)"
              value={editFormData.observations}
              onChangeText={(value) => setEditFormData({ ...editFormData, observations: value })}
              multiline
              numberOfLines={3}
              mode="outlined"
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditDialogVisible(false)}>Cancelar</Button>
            <Button onPress={handleSaveEdit}>Guardar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontWeight: '700',
    color: '#263238',
    marginBottom: 4,
  },
  subtitle: {
    color: '#78909C',
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyCard: {
    marginTop: 40,
    borderRadius: 12,
    elevation: 2,
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
    color: '#263238',
    marginBottom: 8,
  },
  emptyText: {
    color: '#78909C',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  dayCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 3,
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
    color: '#1976D2',
    textTransform: 'capitalize',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sessionsChip: {
    backgroundColor: '#E3F2FD',
  },
  chipText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '600',
  },
  expandIcon: {
    fontSize: 20,
    color: '#1976D2',
    fontWeight: '700',
    marginLeft: 12,
  },
  balanceSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ECEFF1',
    padding: 16,
    borderRadius: 10,
  },
  balanceSummaryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#546E7A',
  },
  balanceSummaryValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  expandDivider: {
    marginVertical: 16,
  },
  sessionsTitle: {
    fontWeight: '600',
    color: '#37474F',
    marginBottom: 12,
  },
  sessionCard: {
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CFD8DC',
    backgroundColor: '#FFFFFF',
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
  },
  sessionBadge: {
    backgroundColor: '#1976D2',
    height: 28,
  },
  sessionBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sessionTime: {
    fontSize: 14,
    color: '#546E7A',
    fontWeight: '500',
  },
  sessionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  concentrationChip: {
    backgroundColor: '#FFF3E0',
    height: 28,
  },
  concentrationText: {
    fontSize: 12,
    color: '#E65100',
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
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  dataLabel: {
    fontSize: 12,
    color: '#546E7A',
    fontWeight: '500',
    marginBottom: 4,
  },
  dataValue: {
    fontSize: 16,
    color: '#263238',
    fontWeight: '600',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ECEFF1',
    padding: 12,
    borderRadius: 8,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#546E7A',
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  observationContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF9C4',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FBC02D',
  },
  observationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F57F17',
    marginBottom: 4,
  },
  observationText: {
    fontSize: 14,
    color: '#5D4037',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 20,
  },
  dialogLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#546E7A',
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
    backgroundColor: '#1976D2',
  },
  concentrationOptionText: {
    fontWeight: '600',
  },
  dialogInput: {
    marginBottom: 12,
  },
});