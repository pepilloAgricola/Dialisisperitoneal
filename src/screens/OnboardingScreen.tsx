import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button, Avatar } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker'; 
import { saveProfile, setOnboardingDone, PatientProfile } from '../utils/profileStorage';
import { useAppTheme } from '../utils/ThemeContext';

export const OnboardingScreen = ({ navigation }: any) => {
  const { theme } = useAppTheme();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleContinue = async () => {
    if (!name.trim() || !age.trim()) {
      Alert.alert('Faltan datos', 'Por favor completa tu nombre y edad');
      return;
    }

    const profile: PatientProfile = {
      name: name.trim(),
      age: parseInt(age),
      photoUri,
    };

    const saved = await saveProfile(profile);
    if (saved) {
      await setOnboardingDone();
      navigation.replace('Welcome');
    }
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido a Dialysis Tracker</Text>
      <Text style={styles.subtitle}>Vamos a personalizar tu experiencia</Text>

      {photoUri ? (
        <Avatar.Image size={120} source={{ uri: photoUri }} style={styles.avatar} />
      ) : (
        <Avatar.Icon 
          size={120} 
          icon="account" 
          style={styles.avatar}
          color={theme.colors.onPrimary}
        />
      )}

      <Button mode="outlined" onPress={pickImage} style={styles.photoButton}>
        {photoUri ? 'Cambiar foto' : 'Añadir foto de perfil'}
      </Button>

      <TextInput 
        label="Nombre completo" 
        value={name} 
        onChangeText={setName} 
        style={styles.input} 
        mode="outlined"
        outlineColor={theme.colors.outline}
        activeOutlineColor={theme.colors.primary}
      />
      
      <TextInput 
        label="Edad" 
        value={age} 
        onChangeText={setAge} 
        keyboardType="numeric" 
        style={styles.input} 
        mode="outlined"
        outlineColor={theme.colors.outline}
        activeOutlineColor={theme.colors.primary}
      />

      <Button 
        mode="contained" 
        onPress={handleContinue} 
        style={styles.continueButton} 
        contentStyle={{ height: 56 }}
      >
        Continuar →
      </Button>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 30, 
    justifyContent: 'center', 
    backgroundColor: theme.colors.background,
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 10, 
    color: theme.colors.primary,
  },
  subtitle: { 
    fontSize: 18, 
    textAlign: 'center', 
    marginBottom: 40, 
    color: theme.colors.outline,
  },
  avatar: { 
    alignSelf: 'center', 
    marginBottom: 16, 
    backgroundColor: theme.colors.primary,
  },
  photoButton: { 
    marginBottom: 30,
    borderColor: theme.colors.primary,
  },
  input: { 
    marginBottom: 20,
    backgroundColor: theme.colors.surface,
  },
  continueButton: { 
    marginTop: 30, 
    borderRadius: 12,
  },
});