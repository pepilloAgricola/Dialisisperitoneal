import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Text, Button, Divider, Switch, List } from 'react-native-paper';
import { getSettings, saveSettings, Settings } from '../utils/settingsStorage';
import { clearAllRecords } from '../utils/storage';
import { useAppTheme } from '../utils/ThemeContext';

export const SettingsScreen = () => {
  const { theme, isDarkMode, toggleTheme } = useAppTheme();
  const [settings, setSettings] = useState<Settings>({
    notificationsEnabled: false,
    darkMode: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const savedSettings = await getSettings();
    setSettings(savedSettings);
  };

  // Evita render si theme no está listo (previene crash por undefined en estilos)
  if (!theme) {
    return null;
  }

  const styles = createStyles(theme);

  const handleToggleNotifications = async (value: boolean) => {
    const newSettings = { ...settings, notificationsEnabled: value };
    setSettings(newSettings);
    await saveSettings(newSettings);
    if (value) {
      Alert.alert('Notificaciones', 'Las notificaciones están habilitadas. Recibirás recordatorios para tus sesiones.');
    }
  };

  const handleToggleDarkMode = async () => {
    toggleTheme(); // Usa el contexto de tema
    const newSettings = { ...settings, darkMode: !isDarkMode };
    setSettings(newSettings);
    await saveSettings(newSettings);
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

  const handleExportData = () => {
    Alert.alert(
      'Exportar Datos',
      'Esta función estará disponible en una próxima actualización. Permitirá exportar todos tus registros a un archivo CSV.',
      [{ text: 'Entendido' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          ⚙️ Configuración
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Personaliza tu experiencia
        </Text>
      </View>

      {/* Preferencias */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            📱 Preferencias
          </Text>
          <Divider style={styles.divider} />

          <List.Item
            title="Notificaciones"
            description="Recordatorios para sesiones de diálisis"
            left={() => <List.Icon icon="bell-outline" />}
            right={() => (
              <Switch
                value={settings.notificationsEnabled === true}
                onValueChange={handleToggleNotifications}
              />
            )}
            style={styles.listItem}
          />

          <List.Item
            title="Modo oscuro"
            description="Apariencia nocturna"
            left={() => <List.Icon icon="weather-night" />}
            right={() => (
              <Switch
                value={isDarkMode === true}
                onValueChange={handleToggleDarkMode}
              />
            )}
            style={styles.listItem}
          />

          <Text style={styles.helpText}>
            Las notificaciones requieren permisos de la app. El modo oscuro ahorra batería en pantallas OLED.
          </Text>
        </Card.Content>
      </Card>

      {/* Datos y Privacidad */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            🔒 Datos y Privacidad
          </Text>
          <Divider style={styles.divider} />

          <Button
            mode="outlined"
            onPress={handleExportData}
            icon="file-export-outline"
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
          >
            Exportar Datos
          </Button>

          <Button
            mode="outlined"
            onPress={handleClearAllData}
            icon="delete-outline"
            style={[styles.actionButton, styles.dangerButton]}
            contentStyle={styles.actionButtonContent}
            textColor={theme.colors.error}
          >
            Eliminar Todos los Datos
          </Button>

          <View style={styles.warningBox}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              Tus datos se almacenan localmente en tu dispositivo. No se comparten con terceros.
            </Text>
          </View>
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

          <Divider style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Desarrollado por</Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoValue}>Jose Aurelio Cañete Rios</Text>
            </View>
          </View>

          <Divider style={styles.infoDivider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Contacto</Text>
            <View style={styles.infoValueContainer}>
              <Text style={styles.infoValue}>joseaureliocaneterios231704@gmail.com</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Sobre la App */}
      <Card style={styles.aboutCard} mode="outlined">
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            📱 Sobre Dialysis Tracker
          </Text>
          <Divider style={styles.divider} />

          <Text style={styles.aboutText}>
            Aplicación diseñada para pacientes en diálisis peritoneal. Ayuda a llevar un control detallado de sesiones, balances hídricos y historial de tratamiento.
          </Text>

          <Text style={styles.aboutText}>
            Recuerda: Esta app es una herramienta de apoyo y NO reemplaza el consejo médico profesional.
          </Text>

          <Text style={styles.aboutSubtext}>
            Desarrollado con ❤️ para mejorar la calidad de vida de pacientes en diálisis.
          </Text>
        </Card.Content>
      </Card>

      <View style={styles.bottomSpacer} />
    </ScrollView>
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
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: theme.colors.surface,
  },
  sectionTitle: {
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  divider: {
    marginBottom: 16,
    backgroundColor: theme.colors.outline,
  },
  listItem: {
    paddingHorizontal: 0,
  },
  helpText: {
    fontSize: 12,
    color: theme.colors.outline,
    fontStyle: 'italic',
    marginTop: 12,
    lineHeight: 16,
  },
  actionButton: {
    marginBottom: 12,
    borderRadius: 8,
  },
  actionButtonContent: {
    paddingVertical: 6,
  },
  dangerButton: {
    borderColor: theme.colors.error,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.errorContainer,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.onErrorContainer,
    lineHeight: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.outline,
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.onSurface,
    fontWeight: '600',
    textAlign: 'right',
  },
  infoValueContainer: {
    alignItems: 'flex-end',
  },
  infoDivider: {
    marginVertical: 8,
    backgroundColor: theme.colors.surfaceVariant,
  },
  aboutCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryContainer + '40',
    borderColor: theme.colors.primary,
  },
  aboutText: {
    color: theme.colors.onSurface,
    lineHeight: 20,
    marginBottom: 8,
  },
  aboutSubtext: {
    color: theme.colors.outline,
    fontStyle: 'italic',
  },
  bottomSpacer: {
    height: 20,
  },
});