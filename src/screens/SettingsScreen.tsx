import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Card, Text, Button, Divider, Switch, List } from 'react-native-paper';
import { getSettings, saveSettings, Settings } from '../utils/settingsStorage';
import { clearAllRecords } from '../utils/storage';
import { useAppTheme } from '../utils/ThemeContext';
import { FadeInView } from '../components/FadeInView';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { commonRadius, commonSpacing } from '../utils/themeStyles';

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

  if (!theme) {
    return null;
  }

  const styles = createStyles(theme);

  const handleToggleNotifications = async (value: boolean) => {
    const newSettings = { ...settings, notificationsEnabled: value };
    setSettings(newSettings);
    await saveSettings(newSettings);
    if (value) {
      Alert.alert(
        'Notificaciones',
        'Recibirás recordatorios para tus sesiones.'
      );
    }
  };

  const handleToggleDarkMode = async () => {
    toggleTheme();
    const newSettings = { ...settings, darkMode: !isDarkMode };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Eliminar todos los datos',
      '¿Estás seguro de que deseas eliminar TODOS los registros de diálisis? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar todo',
          style: 'destructive',
          onPress: async () => {
            const success = await clearAllRecords();
            if (success) {
              Alert.alert('Éxito', 'Todos los registros han sido eliminados');
            } else {
              Alert.alert('Error', 'No se pudieron eliminar los registros');
            }
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Exportar datos',
      'Esta función estará disponible en una próxima actualización.',
      [{ text: 'Entendido' }]
    );
  };

  return (
    <ScreenScaffold contentContainerStyle={styles.contentContainer}>
      <FadeInView delay={20} offsetY={8}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Configuración
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Ajusta la app para que se adapte a tu rutina.
          </Text>
        </View>
      </FadeInView>

      <FadeInView delay={60} offsetY={10}>
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Preferencias
            </Text>
            <Divider style={styles.divider} />

            <List.Item
              title="Notificaciones"
              description="Recordatorios para sesiones de diálisis"
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
              left={() => <List.Icon icon="bell-outline" color={theme.colors.primary} />}
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
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
              left={() => <List.Icon icon="theme-light-dark" color={theme.colors.primary} />}
              right={() => (
                <Switch
                  value={isDarkMode === true}
                  onValueChange={handleToggleDarkMode}
                />
              )}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>
      </FadeInView>

      <FadeInView delay={100} offsetY={10}>
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Datos y privacidad
            </Text>
            <Divider style={styles.divider} />

            <Button
              mode="outlined"
              onPress={handleExportData}
              icon="file-export-outline"
              style={styles.actionButton}
              contentStyle={styles.actionButtonContent}
            >
              Exportar datos
            </Button>

            <Button
              mode="outlined"
              onPress={handleClearAllData}
              icon="trash-can-outline"
              style={[styles.actionButton, styles.dangerButton]}
              contentStyle={styles.actionButtonContent}
              textColor={theme.colors.error}
            >
              Eliminar todos los datos
            </Button>

            <View style={styles.warningBox}>
              <List.Icon icon="shield-lock-outline" color={theme.colors.warning} />
              <Text style={styles.warningText}>
                Tus datos se almacenan localmente en este dispositivo.
              </Text>
            </View>
          </Card.Content>
        </Card>
      </FadeInView>

      <FadeInView delay={140} offsetY={10}>
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Información
            </Text>
            <Divider style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Versión</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>

            <Divider style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Desarrollado por</Text>
              <Text style={styles.infoValue}>Jose Aurelio Cañete Rios</Text>
            </View>

            <Divider style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Contacto</Text>
              <Text style={styles.infoValue}>joseaureliocaneterios231704@gmail.com</Text>
            </View>
          </Card.Content>
        </Card>
      </FadeInView>

      <FadeInView delay={180} offsetY={10}>
        <Card style={styles.aboutCard} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Sobre Dialysis Tracker
            </Text>
            <Divider style={styles.divider} />

            <Text style={styles.aboutText}>
              Aplicación de apoyo para el seguimiento de diálisis peritoneal con enfoque en simplicidad.
            </Text>
            <Text style={styles.aboutSubtext}>
              No reemplaza el consejo médico profesional.
            </Text>
          </Card.Content>
        </Card>
      </FadeInView>
    </ScreenScaffold>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    contentContainer: {
      paddingBottom: commonSpacing.xxxl,
    },
    header: {
      marginBottom: commonSpacing.sm,
      paddingHorizontal: 2,
    },
    title: {
      fontWeight: '700',
      color: theme.colors.onBackground,
      marginBottom: 4,
      letterSpacing: 0.2,
    },
    subtitle: {
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
    },
    card: {
      marginBottom: commonSpacing.md,
      borderRadius: commonRadius.xxl,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      elevation: 1,
    },
    sectionTitle: {
      fontWeight: '700',
      color: theme.colors.primary,
      marginBottom: 8,
    },
    divider: {
      marginBottom: commonSpacing.md,
      backgroundColor: theme.colors.outlineVariant,
    },
    listItem: {
      paddingHorizontal: 0,
      borderRadius: commonRadius.lg,
      marginBottom: 6,
    },
    listTitle: {
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
    listDescription: {
      color: theme.colors.onSurfaceVariant,
    },
    actionButton: {
      marginBottom: 12,
      borderRadius: commonRadius.xl,
      borderColor: theme.colors.outlineVariant,
    },
    actionButtonContent: {
      height: 46,
    },
    dangerButton: {
      borderColor: theme.colors.error,
    },
    warningBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: `${theme.colors.warning}1A`,
      borderRadius: commonRadius.lg,
      borderWidth: 1,
      borderColor: `${theme.colors.warning}40`,
      paddingVertical: 8,
      paddingHorizontal: 4,
      marginTop: 4,
    },
    warningText: {
      flex: 1,
      fontSize: 13,
      color: theme.colors.onSurface,
      lineHeight: 18,
      marginLeft: -8,
      marginRight: 8,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
      paddingVertical: 8,
    },
    infoLabel: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '500',
      flex: 1,
    },
    infoValue: {
      fontSize: 14,
      color: theme.colors.onSurface,
      fontWeight: '600',
      flex: 1.2,
      textAlign: 'right',
    },
    infoDivider: {
      marginVertical: 8,
      backgroundColor: theme.colors.outlineVariant,
    },
    aboutCard: {
      borderRadius: commonRadius.xxl,
      backgroundColor: `${theme.colors.primaryContainer}55`,
      borderColor: theme.colors.outlineVariant,
    },
    aboutText: {
      color: theme.colors.onSurface,
      lineHeight: 20,
      marginBottom: 8,
    },
    aboutSubtext: {
      color: theme.colors.onSurfaceVariant,
    },
  });
