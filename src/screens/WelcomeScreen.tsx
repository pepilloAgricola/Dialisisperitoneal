import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Avatar, IconButton, Card } from 'react-native-paper';
import { getAllRecords } from '../utils/storage';
import { getProfile, PatientProfile } from '../utils/profileStorage';
import { useAppTheme } from '../utils/ThemeContext';

export const WelcomeScreen = ({ navigation }: any) => {
  const { theme } = useAppTheme();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [yesterdayBalance, setYesterdayBalance] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const prof = await getProfile();
    setProfile(prof);

    const all = await getAllRecords();
    const dates = Object.keys(all).sort().reverse();
    const yesterday = dates[1];
    if (yesterday && all[yesterday]) {
      setYesterdayBalance(all[yesterday].totalBalance);
    }
  };

  const getBalanceColor = (balance: number) => 
    balance >= 0 ? theme.colors.success : theme.colors.error;

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton 
          icon="cog" 
          size={28} 
          iconColor={theme.colors.primary}
          onPress={() => navigation.navigate('Settings')} 
        />
      </View>

      <Text style={styles.greeting}>¡TÚ PUEDES!</Text>

      {profile?.photoUri ? (
        <Avatar.Image 
          size={120} 
          source={{ uri: profile.photoUri }} 
          style={styles.avatar} 
        />
      ) : (
        <Avatar.Icon 
          size={120} 
          icon="account" 
          style={styles.avatar}
          color={theme.colors.onPrimary}
        />
      )}

      <Text style={styles.name}>{profile?.name || 'Paciente'}</Text>
      {profile?.age && (
        <Text style={styles.age}>Edad: {profile.age} años</Text>
      )}

      {/* Tarjeta de Balance de Ayer */}
      {yesterdayBalance !== null && (
        <Card style={styles.balanceCard} mode="elevated">
          <Card.Content style={styles.balanceContent}>
            <Text variant="bodyMedium" style={styles.balanceLabel}>
              Balance de Ayer
            </Text>
            <Text 
              variant="headlineMedium"
              style={[styles.balanceValue, { color: getBalanceColor(yesterdayBalance) }]}
            >
              {yesterdayBalance > 0 ? '+' : ''}
              {yesterdayBalance} ml
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Botones de Tipo de Diálisis */}
      <View style={styles.buttonsContainer}>
        <Card style={styles.dialysisCard} mode="outlined">
          <Card.Content style={styles.dialysisCardContent}>
            <Text variant="titleMedium" style={styles.dialysisCardTitle}>
              💧 Diálisis Manual
            </Text>
            <Text variant="bodySmall" style={styles.dialysisCardSubtitle}>
              CAPD - Diálisis Peritoneal Ambulatoria Continua
            </Text>
            <Button
              mode="contained"
              style={styles.dialysisButton}
              contentStyle={styles.dialysisButtonContent}
              onPress={() => navigation.navigate('ManualDialysis')}
              icon="hand-back-right"
            >
              Registrar Sesión
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.dialysisCard} mode="outlined">
          <Card.Content style={styles.dialysisCardContent}>
            <Text variant="titleMedium" style={styles.dialysisCardTitle}>
              🤖 Diálisis Automatizada
            </Text>
            <Text variant="bodySmall" style={styles.dialysisCardSubtitle}>
              APD - Diálisis Peritoneal Automatizada
            </Text>
            <Button
              mode="contained"
              style={styles.dialysisButton}
              contentStyle={styles.dialysisButtonContent}
              onPress={() => navigation.navigate('AutomatedDialysis')}
              icon="robot"
            >
              Registrar Sesión
            </Button>
          </Card.Content>
        </Card>
      </View>

      {/* Botón de Historial */}
      <Button
        mode="outlined"
        style={styles.historyButton}
        contentStyle={styles.historyButtonContent}
        onPress={() => navigation.navigate('History')}
        icon="history"
      >
        Ver Historial Completo
      </Button>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: theme.colors.background,
  },
  header: { 
    alignItems: 'flex-end',
  },
  greeting: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginVertical: 20, 
    color: theme.colors.primary,
  },
  avatar: { 
    alignSelf: 'center', 
    marginBottom: 16, 
    backgroundColor: theme.colors.primary,
  },
  name: { 
    fontSize: 28, 
    fontWeight: '700', 
    textAlign: 'center', 
    color: theme.colors.onBackground,
  },
  age: { 
    fontSize: 18, 
    textAlign: 'center', 
    color: theme.colors.outline, 
    marginBottom: 20,
  },
  balanceCard: {
    marginVertical: 20,
    borderRadius: 16,
    elevation: 3,
    backgroundColor: theme.colors.surface,
  },
  balanceContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  balanceLabel: {
    color: theme.colors.outline,
    marginBottom: 8,
  },
  balanceValue: {
    fontWeight: '700',
  },
  buttonsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  dialysisCard: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  dialysisCardContent: {
    paddingVertical: 12,
  },
  dialysisCardTitle: {
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  dialysisCardSubtitle: {
    color: theme.colors.outline,
    marginBottom: 12,
  },
  dialysisButton: {
    borderRadius: 8,
  },
  dialysisButtonContent: {
    height: 50,
  },
  historyButton: { 
    marginTop: 8, 
    borderRadius: 12,
    borderColor: theme.colors.primary,
  },
  historyButtonContent: {
    height: 50,
  },
});