import React, { useEffect, useState } from 'react';al\Android\Sdk"
# o to clear cache
npx expo start -cr">
# if you use dev-client
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)

**Aplicación móvil para el seguimiento y control de sesiones de diálisis peritoneal**

[Características](#-características) • [Instalación](#-instalación) • [Uso](#-uso) • [Estructura](#-estructura-del-proyecto) • [Contribuir](#-contribuir)

</div>

---

## 📋 Descripción

**Dialysis Tracker** es una aplicación móvil diseñada para pacientes que realizan diálisis peritoneal, permitiéndoles llevar un control detallado de sus sesiones diarias, monitorear balances hídricos y mantener un historial completo de su tratamiento.

La aplicación facilita el registro de información crucial como:
- Volumen de infusión
- Volumen de drenaje
- Balance hídrico (positivo/negativo)
- Concentración de la solución utilizada
- Observaciones médicas

## ✨ Características

### 🏠 Registro de Sesiones
- ✅ Registro rápido de hasta 4 sesiones diarias
- ✅ Selección de fecha personalizada
- ✅ Múltiples concentraciones de solución (1.5%, 2.5%, 4.5%)
- ✅ Cálculo automático de balance hídrico
- ✅ Campo para observaciones médicas
- ✅ Infusión predeterminada configurable

### 📊 Historial Completo
- ✅ Vista organizada por días
- ✅ Tarjetas expandibles con detalles de cada sesión
- ✅ Búsqueda por fecha
- ✅ Balance total diario destacado
- ✅ Edición de sesiones registradas
- ✅ Eliminación de registros con confirmación

### ⚙️ Configuración Personalizable
- ✅ Ajuste de infusión predeterminada
- ✅ Configuración de rangos de balance saludable
- ✅ Preferencias de notificaciones
- ✅ Opción para eliminar todos los datos
- ✅ Restablecimiento de configuración

### 🎨 Interfaz de Usuario
- ✅ Diseño limpio y moderno
- ✅ Código de colores para balances (verde: positivo, rojo: negativo)
- ✅ Navegación intuitiva
- ✅ Iconos descriptivos
- ✅ Experiencia optimizada para uso diario

## 🚀 Instalación

### Prerequisitos

```bash
node >= 14.0.0
npm >= 6.0.0
```

### Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/dialysis-tracker.git
cd dialysis-tracker
```

### Instalar dependencias

```bash
npm install
```

### Ejecutar la aplicación

```bash
# Para Android
npm run android

# Para iOS
npm run ios

# Con Expo
npx expo start
```

## 📦 Dependencias Principales

```json
{
  "react": "18.x.x",
  "react-native": "0.x.x",
  "react-native-paper": "^5.x.x",
  "@react-navigation/native": "^6.x.x",
  "@react-navigation/native-stack": "^6.x.x",
  "@react-native-async-storage/async-storage": "^1.x.x",
  "@react-native-community/datetimepicker": "^7.x.x",
  "typescript": "^5.x.x"
}
```

## 📱 Uso

### 1. Registrar una nueva sesión

1. Abre la aplicación
2. Selecciona la fecha (por defecto: fecha actual)
3. Selecciona la concentración de la solución
4. Ingresa el volumen de drenaje en ml
5. (Opcional) Agrega observaciones
6. Presiona "Guardar Registro"

### 2. Ver historial

1. Presiona "Ver Historial" en la pantalla principal
2. Navega por las fechas registradas
3. Toca una fecha para expandir y ver detalles
4. Usa la barra de búsqueda para encontrar fechas específicas

### 3. Editar o eliminar sesiones

1. En el historial, expande el día deseado
2. Presiona el ícono de lápiz (✏️) para editar
3. Presiona el ícono de papelera (🗑️) para eliminar

### 4. Configurar la aplicación

1. Presiona el ícono de engranaje (⚙️) en la esquina superior derecha
2. Ajusta la infusión predeterminada
3. Configura rangos de balance saludable
4. Guarda los cambios

## 🗂️ Estructura del Proyecto

```
dialysis-tracker/
├── App.tsx                      # Punto de entrada y navegación
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx       # Pantalla de registro
│   │   ├── HistoryScreen.tsx    # Pantalla de historial
│   │   └── SettingsScreen.tsx   # Pantalla de configuración
│   ├── utils/
│   │   ├── storage.ts           # Gestión de registros
│   │   └── settingsStorage.ts   # Gestión de configuración
│   └── types/
│       └── index.ts             # Definiciones de TypeScript
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 Tipos de Datos

### DialysisRecord
```typescript
interface DialysisRecord {
  id: string;
  bagType: 1.5 | 2.5 | 4.5;
  infusion: number;
  drainage: number;
  balance: number;
  observations: string;
  timestamp: string;
}
```

### DailyRecord
```typescript
interface DailyRecord {
  date: string;
  records: DialysisRecord[];
  totalBalance: number;
}
```

### Settings
```typescript
interface Settings {
  defaultInfusion: number;
  minHealthyBalance: number;
  maxHealthyBalance: number;
  notificationsEnabled: boolean;
  darkMode: boolean;
}
```

## 🎯 Roadmap

- [ ] 📈 Dashboard con estadísticas y gráficos
- [ ] 📄 Exportación de reportes en PDF
- [ ] 📧 Envío de reportes por email
- [ ] ⏰ Sistema de recordatorios y alarmas
- [ ] 🌙 Modo oscuro
- [ ] 📊 Análisis de tendencias y patrones
- [ ] 👤 Perfil de paciente con datos médicos
- [ ] 🔄 Sincronización en la nube
- [ ] 🌐 Soporte multi-idioma
- [ ] 📱 Widgets para la pantalla de inicio

## 🤝 Contribuir

Las contribuciones son bienvenidas. Si deseas contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👨‍⚕️ Aviso Médico

**IMPORTANTE:** Esta aplicación es una herramienta de seguimiento personal y **NO** reemplaza el consejo médico profesional. Siempre consulte con su nefrólogo o equipo médico para decisiones relacionadas con su tratamiento de diálisis peritoneal.

## 📧 Contacto

**Jose Aurelio Cañete Rios** - joseaureliocaneterios231704@gmail.com

Link del Proyecto: [https://github.com/pepilloAgricola/Dialisisperitoneal](https://github.com/pepilloAgricola/Dialisisperitoneal)

---

<div align="center">

**Desarrollado con ❤️ para pacientes en diálisis peritoneal**

⭐ Si esta aplicación te resultó útil, considera darle una estrella en GitHub

</div>