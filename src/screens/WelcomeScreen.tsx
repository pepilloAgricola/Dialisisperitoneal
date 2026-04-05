import React, { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Avatar, IconButton, Card, Chip } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getAllRecords } from '../utils/storage';
import { getProfile, PatientProfile } from '../utils/profileStorage';
import { DialysisRecord } from '../types';
import { useAppTheme } from '../utils/ThemeContext';
import { FadeInView } from '../components/FadeInView';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { commonRadius, commonSpacing } from '../utils/themeStyles';

export const WelcomeScreen = ({ navigation }: any) => {
  const { theme } = useAppTheme();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [todayCount, setTodayCount] = useState(0);
  const [lastSessionDate, setLastSessionDate] = useState<Date | null>(null);
  const [lastManual, setLastManual] = useState<DialysisRecord | null>(null);
  const [lastAutomated, setLastAutomated] = useState<DialysisRecord | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const [prof, allRecords] = await Promise.all([getProfile(), getAllRecords()]);
    setProfile(prof);

    const all = Object.values(allRecords).flatMap((day) => day.records);
    all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const todayKey = formatDateKey(new Date());
    const todaySessions = allRecords[todayKey]?.records || [];

    setTodayCount(todaySessions.length);
    setLastSessionDate(all[0] ? new Date(all[0].timestamp) : null);
    setLastManual(all.find((record) => record.type === 'manual') || null);
    setLastAutomated(all.find((record) => record.type === 'automated') || null);
  };

  const formatDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getInitials = (name?: string): string => {
    if (!name || !name.trim()) return 'P';
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((part) => part[0].toUpperCase()).join('');
  };

  const formatRelativeTime = (date: Date | null): string => {
    if (!date) return 'Sin sesiones';
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `Hace ${days} d`;

    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  const formatSessionSummary = (record: DialysisRecord | null): string => {
    if (!record) return 'Sin sesiones registradas';

    const date = new Date(record.timestamp);
    const when = date.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    return `${when} • Balance ${record.balance > 0 ? '+' : ''}${record.balance} ml`;
  };

  const formatSignedBalance = (record: DialysisRecord | null) => {
    if (!record) return '';
    return `${record.balance > 0 ? '+' : ''}${record.balance} ml`;
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return theme.colors.success;
    if (balance < 0) return theme.colors.error;
    return theme.colors.outline;
  };

  const getAutomatedBalanceColor = (balance: number) => {
    if (balance < 0) return theme.colors.success;
    if (balance > 0) return theme.colors.error;
    return theme.colors.outline;
  };

  const styles = createStyles(theme);

  return (
    <ScreenScaffold contentContainerStyle={styles.contentContainer}>
      <FadeInView delay={20} offsetY={8}>
        <Card style={styles.heroCard} mode="elevated">
          <Card.Content>
            <View style={styles.heroTopRow}>
              <View style={styles.profileSide}>
                {profile?.photoUri ? (
                  <Avatar.Image size={56} source={{ uri: profile.photoUri }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.initialsBadge}>
                    <Text style={styles.initialsText}>{getInitials(profile?.name)}</Text>
                  </View>
                )}
                <View>
                  <Text style={styles.kicker}>Panel clínico</Text>
                  <Text style={styles.patientName}>{profile?.name || 'Paciente'}</Text>
                </View>
              </View>

              <IconButton
                icon="cog-outline"
                iconColor={theme.colors.onSurfaceVariant}
                size={22}
                style={styles.headerIcon}
                onPress={() => navigation.navigate('Settings')}
              />
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Sesiones hoy</Text>
                <Text style={styles.metricValue}>{todayCount}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Última sesión</Text>
                <Text style={styles.metricValueSmall}>{formatRelativeTime(lastSessionDate)}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </FadeInView>

      <FadeInView delay={65} offsetY={10}>
        <Card style={styles.mainCard} mode="elevated">
          <Card.Content style={styles.mainCardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>CAPD</Text>
              <Chip compact style={styles.chip} textStyle={styles.chipText}>
                Manual
              </Chip>
            </View>
            <Text style={styles.cardSubtitle}>Intercambios peritoneales durante el día</Text>
            <Text style={styles.sessionLabel}>Última sesión</Text>
            <Text style={styles.sessionValue}>{formatSessionSummary(lastManual)}</Text>
            {!!lastManual && (
              <Text style={[styles.balanceBadge, { color: getBalanceColor(lastManual.balance) }]}>
                Balance {formatSignedBalance(lastManual)}
              </Text>
            )}
            <Button
              mode="contained"
              icon="water"
              style={styles.primaryButton}
              contentStyle={styles.primaryButtonContent}
              onPress={() => navigation.navigate('ManualDialysis')}
            >
              Registrar CAPD
            </Button>
          </Card.Content>
        </Card>
      </FadeInView>

      <FadeInView delay={95} offsetY={10}>
        <Card style={styles.mainCard} mode="elevated">
          <Card.Content style={styles.mainCardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>APD</Text>
              <Chip compact style={styles.chip} textStyle={styles.chipText}>
                Automatizada
              </Chip>
            </View>
            <Text style={styles.cardSubtitle}>Tratamiento nocturno con cicladora</Text>
            <Text style={styles.sessionLabel}>Última sesión</Text>
            <Text style={styles.sessionValue}>{formatSessionSummary(lastAutomated)}</Text>
            {!!lastAutomated && (
              <Text style={[styles.balanceBadge, { color: getAutomatedBalanceColor(lastAutomated.balance) }]}>
                Balance {formatSignedBalance(lastAutomated)}
              </Text>
            )}
            <Button
              mode="contained"
              icon="robot-outline"
              style={styles.primaryButton}
              contentStyle={styles.primaryButtonContent}
              onPress={() => navigation.navigate('AutomatedDialysis')}
            >
              Registrar APD
            </Button>
          </Card.Content>
        </Card>
      </FadeInView>

      <FadeInView delay={130} offsetY={8}>
        <Card style={styles.quickActionsCard} mode="outlined">
          <Card.Content style={styles.quickActionsContent}>
            <Button
              mode="outlined"
              icon="history"
              style={styles.quickButton}
              onPress={() => navigation.navigate('History')}
            >
              Historial
            </Button>
            <Button
              mode="outlined"
              icon="cog-outline"
              style={styles.quickButton}
              onPress={() => navigation.navigate('Settings')}
            >
              Ajustes
            </Button>
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
    heroCard: {
      borderRadius: commonRadius.xxl,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      marginBottom: commonSpacing.md,
    },
    heroTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: commonSpacing.md,
    },
    profileSide: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    avatarImage: {
      backgroundColor: theme.colors.primary,
    },
    initialsBadge: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.primaryContainer,
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    initialsText: {
      color: theme.colors.primary,
      fontWeight: '700',
      fontSize: 20,
    },
    kicker: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontWeight: '700',
      marginBottom: 2,
    },
    patientName: {
      color: theme.colors.onSurface,
      fontWeight: '700',
      fontSize: 22,
      lineHeight: 28,
      maxWidth: 210,
    },
    headerIcon: {
      margin: 0,
      backgroundColor: theme.colors.surfaceVariant,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    metricsRow: {
      flexDirection: 'row',
      gap: commonSpacing.sm,
    },
    metricCard: {
      flex: 1,
      borderRadius: commonRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceVariant,
      paddingHorizontal: commonSpacing.md,
      paddingVertical: commonSpacing.sm,
    },
    metricLabel: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      marginBottom: 4,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    metricValue: {
      color: theme.colors.onSurface,
      fontSize: 30,
      fontWeight: '700',
      lineHeight: 36,
    },
    metricValueSmall: {
      color: theme.colors.onSurface,
      fontSize: 17,
      fontWeight: '700',
      lineHeight: 24,
    },
    mainCard: {
      borderRadius: commonRadius.xxl,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      marginBottom: commonSpacing.md,
    },
    mainCardContent: {
      paddingHorizontal: commonSpacing.md,
      paddingVertical: commonSpacing.md,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: commonSpacing.xs,
    },
    cardTitle: {
      color: theme.colors.onSurface,
      fontSize: 30,
      fontWeight: '700',
    },
    chip: {
      backgroundColor: theme.colors.surfaceVariant,
      borderColor: theme.colors.outlineVariant,
      borderWidth: 1,
    },
    chipText: {
      color: theme.colors.onSurfaceVariant,
      fontWeight: '600',
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    cardSubtitle: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: 10,
      fontSize: 14,
    },
    sessionLabel: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 3,
      fontWeight: '700',
    },
    sessionValue: {
      color: theme.colors.onSurface,
      fontSize: 16,
      marginBottom: 8,
      fontWeight: '600',
      lineHeight: 22,
    },
    balanceBadge: {
      fontSize: 13,
      fontWeight: '700',
      marginBottom: commonSpacing.md,
    },
    primaryButton: {
      borderRadius: commonRadius.xl,
    },
    primaryButtonContent: {
      height: 48,
    },
    quickActionsCard: {
      borderRadius: commonRadius.xxl,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
    },
    quickActionsContent: {
      flexDirection: 'row',
      gap: commonSpacing.sm,
    },
    quickButton: {
      flex: 1,
      borderRadius: commonRadius.xl,
      borderColor: theme.colors.outlineVariant,
    },
  });
