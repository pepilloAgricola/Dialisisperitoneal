import React from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../utils/ThemeContext';
import { commonSpacing } from '../utils/themeStyles';

interface ScreenScaffoldProps {
  children: React.ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const ScreenScaffold: React.FC<ScreenScaffoldProps> = ({
  children,
  contentContainerStyle,
  scroll = true,
  style,
}) => {
  const { theme, isDarkMode } = useAppTheme();

  const gradientColors: [string, string, string] = isDarkMode
    ? [theme.colors.background, '#111F33', theme.colors.background]
    : ['#EDF4FF', '#F8FAFE', theme.colors.background];

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }, style]}>
      <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFillObject} />
      <View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            backgroundColor: `${theme.colors.primary}1A`,
          },
        ]}
      />

      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, contentContainerStyle]}>{children}</View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: commonSpacing.lg,
    paddingTop: commonSpacing.md,
    paddingBottom: commonSpacing.xl,
  },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 999,
    top: -130,
    left: -70,
  },
});
