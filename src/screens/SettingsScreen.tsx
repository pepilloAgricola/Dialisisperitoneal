import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Text, TextInput, Button, Divider, Switch, List } from 'react-native-paper';
import { getSettings, saveSettings, Settings } from '../utils/settingsStorage';
import { clearAllRecords } from '../utils/storage';

export const SettingsScreen = () => {
  const [settings, setSettings] = useState<Settings>({
    defaultInfusion: 2000,
    minHealthyBalance: -500,
    maxHealthyBalance: 500,
    notificationsEnabled: false,
    darkMode: false,
  });

  const [tempInfusion, setTempInfusion] = useState('2000');
  const [tempMinBalance, setTempMinBalance] = useState('-500');
  const [tempMaxBalance, setTempMaxBalance] = useState('500');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const savedSettings = await getSettings();
    setSettings(savedSettings);
    setTempInfusion(savedSettings.defaultInfusion.toString());
    setTempMinBalance(savedSettings.minHealthyBalance.toString());
    setTempMaxBalance(savedSettings.maxHealthyBalance.toString());
  };

  const handleSaveSettings = async () => {
    const infusion = parseFloat(tempInfusion);
    const minBalance = parseFloat(tempMinBalance);
    const maxBalance = parseFloat(tempMaxBalance);

    if (isNaN(infusion) || infusion <= 0) {
      Alert.alert('Error', 'La infusión debe ser un número válido mayor a 0');
      return;
    }

    if (isNaN(minBalance) || isNaN(maxBalance)) {
      Alert.alert('Error', 'Los rangos de balance deben ser números válidos');
      return;
    }

    if (minBalance >= maxBalance) {
      Alert.alert('Error', 'El balance mínimo debe ser menor que el máximo');
      return;
    }

    const newSettings: Settings = {
      ...settings,
      defaultInfusion: infusion,
      minHealthyBalance: minBalance,
      maxHealthyBalance: maxBalance,
    };

    const success = await saveSettings(newSettings);
    if (success) {
      setSettings(newSettings);
      Alert.alert('Éxito', 'Configuración guardada correctamente');
    } else {
      Alert.alert('Error', 'No se pudo guardar la configuración');
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    const newSettings = { ...settings, notificationsEnabled: value };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const handleToggleDarkMode = async (value: boolean) => {
    const newSettings = { ...settings, darkMode: value };
    setSettings(newSettings);
    await saveSettings(newSettings);
    Alert.alert('Modo Oscuro', 'Esta función estará disponible en una próxima actualización');
  };

  const handleClearAllData = () => {
    Alert.alert(
      '⚠️ Eliminar Todos los Datos',
      '¿Estás seguro de que deseas eliminar TODOS los registros de diálisis? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar Todo',
          style: 'destructive',
          onPress: async () => {
            const success = await clearAllRecords();
            if (success) {
              Alert.alert('Éxito', 'Todos los registros han sido eliminados');
            } else {
              Alert.alert('Error', 'No se pudieron eliminar los registros');
            }
          }
        }
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Restablecer Configuración',
      '¿Deseas restablecer la configuración a los valores predeterminados?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          onPress: () => {
            setTempInfusion('2000');
            setTempMinBalance('-500');
            setTempMaxBalance('500');
            Alert.alert('Éxito', 'Configuración restablecida. Presiona "Guardar Cambios" para aplicar.');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          ⚙️ Configuración
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Personaliza tu aplicación de diálisis
        </Text>
      </View>

      {/* Configuración de Infusión */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            💉 Valores Predeterminados
          </Text>
          <Divider style={styles.divider} />

          <Text style={styles.fieldLabel}>Infusión predeterminada (ml)</Text>
          <TextInput
            value={tempInfusion}
            onChangeText={setTempInfusion}
            keyboardType="numeric"
            mode="outlined"
            placeholder="2000"
            style={styles.input}
            left={<TextInput.Icon icon="water" />}
          />
          <Text style={styles.helpText}>
            Este valor se usará por defecto al registrar nuevas sesiones
          </Text>
        </Card.Content>
      </Card>

      {/* Rangos de Balance Saludable */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            📊 Rangos de Balance Saludable
          </Text>
          <Divider style={styles.divider} />

          <Text style={styles.fieldLabel}>Balance mínimo saludable (ml)</Text>
          <TextInput
            value={tempMinBalance}
            onChangeText={setTempMinBalance}
            keyboardType="numeric"
            mode="outlined"
            placeholder="-500"
            style={styles.input}
            left={<TextInput.Icon icon="arrow-down" />}
          />

          <Text style={styles.fieldLabel}>Balance máximo saludable (ml)</Text>
          <TextInput
            value={tempMaxBalance}
            onChangeText={setTempMaxBalance}
            keyboardType="numeric"
            mode="outlined"
            placeholder="500"
            style={styles.input}
            left={<TextInput.Icon icon="arrow-up" />}
          />

          <Text style={styles.helpText}>
            Los valores fuera de este rango se destacarán visualmente
          </Text>
        </Card.Content>
      </Card>

      {/* Botón Guardar */}
      <Button
        mode="contained"
        onPress={handleSaveSettings}
        icon="content-save"
        style={styles.saveButton}
        contentStyle={styles.saveButtonContent}
      >
        Guardar Cambios
      </Button>

      {/* Preferencias */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            🔔 Preferencias
          </Text>
          <Divider style={styles.divider} />

          <List.Item
            title="Notificaciones"
            description="Recordatorios para sesiones de diálisis"
            left={() => <List.Icon icon="bell" />}
            right={() => (
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={handleToggleNotifications}
              />
            )}
          />

          <Divider />

          <List.Item
            title="Modo Oscuro"
            description="Tema oscuro para la aplicación (próximamente)"
            left={() => <List.Icon icon="weather-night" />}
            right={() => (
              <Switch
                value={settings.darkMode}
                onValueChange={handleToggleDarkMode}
                disabled
              />
            )}
          />
        </Card.Content>
      </Card>

      {/* Datos */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            💾 Datos
          </Text>
          <Divider style={styles.divider} />

          <Button
            mode="outlined"
            onPress={handleResetSettings}
            icon="restore"
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
          >
            Restablecer Configuración
          </Button>

          <Button
            mode="contained"
            onPress={handleClearAllData}
            icon="delete-forever"
            style={[styles.actionButton, styles.dangerButton]}
            contentStyle={styles.actionButtonContent}
            buttonColor="#F44336"
          >
            Eliminar Todos los Registros
          </Button>

          <Text style={styles.warningText}>
            ⚠️ La eliminación de registros es permanente y no se puede deshacer
          </Text>
        </Card.Content>
      </Card>

      {/* Información de la App */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            ℹ️ Información
          </Text>
          <Divider style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Versión</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Desarrollado para</Text>
            <Text style={styles.infoValue}>Pacientes en Diálisis Peritoneal</Text>
          </View>
        </Card.Content>
      </Card>

      <View style={styles.bottomSpacer} />
    </ScrollView>
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
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#546E7A',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#78909C',
    fontStyle: 'italic',
    marginTop: 4,
  },
  saveButton: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    elevation: 3,
  },
  saveButtonContent: {
    paddingVertical: 8,
  },
  actionButton: {
    marginBottom: 12,
    borderRadius: 8,
  },
  actionButtonContent: {
    paddingVertical: 6,
  },
  dangerButton: {
    borderColor: '#F44336',
  },
  warningText: {
    fontSize: 12,
    color: '#F57C00',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#546E7A',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#263238',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 20,
  },
});