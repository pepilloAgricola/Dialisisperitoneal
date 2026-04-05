import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Avatar, Card } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { saveProfile, setOnboardingDone, PatientProfile } from '../utils/profileStorage';
import { useAppTheme } from '../utils/ThemeContext';
import { FormField } from '../components/FormField';
import { FadeInView } from '../components/FadeInView';
import { useToast, Toast } from '../components/Toast';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { validators } from '../utils/validators';
import { commonSpacing, commonRadius } from '../utils/themeStyles';

export const OnboardingScreen = ({ navigation }: any) => {
  const { theme } = useAppTheme();
  const toast = useToast();
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string>();
  const [age, setAge] = useState('');
  const [ageError, setAgeError] = useState<string>();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validateName = (value: string) => {
    const result = validators.text(value, 'Nombre');
    setNameError(result.error);
    return result.valid;
  };

  const validateAge = (value: string) => {
    const result = validators.age(value);
    setAgeError(result.error);
    return result.valid;
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setPhotoUri(result.assets[0].uri);
        toast.showToast('Foto de perfil actualizada', 'success');
      }
    } catch (error) {
      toast.showToast('Error al seleccionar foto', 'error');
    }
  };

  const handleContinue = async () => {
    const nameValid = validateName(name);
    const ageValid = validateAge(age);

    if (!nameValid || !ageValid) {
      toast.showToast('Por favor completa todos los campos correctamente', 'error');
      return;
    }

    setLoading(true);
    try {
      const normalizedName = name.trim().replace(/\s+/g, ' ');
      const normalizedAge = Number(validators.normalizeNumericInput(age));

      const profile: PatientProfile = {
        name: normalizedName,
        age: normalizedAge,
        photoUri,
      };

      const saved = await saveProfile(profile);
      if (saved) {
        await setOnboardingDone();
        toast.showToast('¡Bienvenido! Iniciando la app...', 'success');
        setTimeout(() => {
          navigation.replace('Welcome');
        }, 500);
      } else {
        toast.showToast('Error al guardar tu perfil', 'error');
      }
    } catch (error) {
      toast.showToast('Error inesperado', 'error');
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(theme);

  return (
    <ScreenScaffold contentContainerStyle={styles.contentContainer}>
      <FadeInView delay={40} offsetY={10}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Dialysis Tracker</Text>
          <Text style={styles.title}>Configura tu perfil</Text>
          <Text style={styles.subtitle}>
            Guarda tus datos básicos para una experiencia más clara y personalizada.
          </Text>
        </View>
      </FadeInView>

      <FadeInView delay={120} offsetY={14}>
        <Card style={styles.panel} mode="elevated">
          <Card.Content style={styles.panelContent}>
            <View style={styles.avatarWrap}>
              {photoUri ? (
                <Avatar.Image size={106} source={{ uri: photoUri }} style={styles.avatar} />
              ) : (
                <Avatar.Icon
                  size={106}
                  icon="account"
                  style={styles.avatar}
                  color={theme.colors.onPrimary}
                />
              )}
            </View>

            <Button
              mode="contained-tonal"
              onPress={pickImage}
              style={styles.photoButton}
              disabled={loading}
              icon="camera-outline"
            >
              {photoUri ? 'Cambiar foto' : 'Añadir foto'}
            </Button>

            <FormField
              label="Nombre completo"
              value={name}
              onChangeText={setName}
              onBlur={() => validateName(name)}
              error={nameError}
              placeholder="Tu nombre"
              theme={theme}
              icon="account"
            />

            <FormField
              label="Edad"
              value={age}
              onChangeText={setAge}
              onBlur={() => validateAge(age)}
              error={ageError}
              placeholder="Ej: 45"
              keyboardType="numeric"
              theme={theme}
              icon="calendar-month-outline"
            />

            <Button
              mode="contained"
              onPress={handleContinue}
              disabled={loading}
              loading={loading}
              style={styles.continueButton}
              contentStyle={styles.continueButtonContent}
              icon="arrow-right"
            >
              Continuar
            </Button>
          </Card.Content>
        </Card>
      </FadeInView>

      <FadeInView delay={180} offsetY={8}>
        <Text style={styles.notice}>
          Tus datos se guardan solo en este dispositivo.
        </Text>
      </FadeInView>

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

const createStyles = (theme: any) =>
  StyleSheet.create({
    contentContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingBottom: commonSpacing.xxxl,
    },
    hero: {
      marginBottom: commonSpacing.lg,
    },
    kicker: {
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      color: theme.colors.primary,
      marginBottom: 6,
      fontWeight: '700',
    },
    title: {
      fontSize: 32,
      fontWeight: '700',
      color: theme.colors.onBackground,
      marginBottom: 6,
      letterSpacing: 0.2,
    },
    subtitle: {
      fontSize: 15,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 22,
    },
    panel: {
      borderRadius: commonRadius.xxl,
      borderColor: theme.colors.outlineVariant,
      borderWidth: 1,
      backgroundColor: theme.colors.surface,
      elevation: 2,
    },
    panelContent: {
      paddingVertical: commonSpacing.md,
    },
    avatarWrap: {
      alignItems: 'center',
      marginBottom: commonSpacing.sm,
    },
    avatar: {
      backgroundColor: theme.colors.primary,
    },
    photoButton: {
      borderRadius: commonRadius.xl,
      marginBottom: commonSpacing.lg,
    },
    continueButton: {
      marginTop: commonSpacing.sm,
      borderRadius: commonRadius.xl,
    },
    continueButtonContent: {
      height: 50,
    },
    notice: {
      marginTop: commonSpacing.md,
      textAlign: 'center',
      color: theme.colors.outline,
      fontSize: 12,
    },
  });
