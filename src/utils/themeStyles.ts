/**
 * Estilos y constantes compartidas para toda la app
 */

export const commonSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const commonRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  pill: 999,
};

export const commonFontSizes = {
  xs: 10,
  sm: 11,
  md: 12,
  lg: 14,
  xl: 16,
  xxl: 18,
  title: 22,
  display: 24,
};

export const commonFontWeights = {
  light: '300' as const,
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const createBaseStyles = (theme: any) => ({
  // Containers
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    padding: commonSpacing.lg,
  },

  // Cards
  card: {
    marginBottom: commonSpacing.md,
    borderRadius: commonRadius.xl,
    elevation: 1,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  cardElevated: {
    elevation: 3,
  },

  // Typography
  sectionTitle: {
    fontSize: commonFontSizes.lg,
    fontWeight: commonFontWeights.semibold,
    color: theme.colors.primary,
    marginBottom: commonSpacing.md,
    marginTop: commonSpacing.md,
    letterSpacing: 0.2,
  },
  bodyText: {
    fontSize: commonFontSizes.md,
    color: theme.colors.onBackground,
    lineHeight: 22,
  },
  helperText: {
    fontSize: commonFontSizes.sm,
    color: theme.colors.outline,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: commonFontSizes.sm,
    color: theme.colors.error,
    fontStyle: 'italic',
  },

  // Buttons & Inputs
  inputField: {
    backgroundColor: theme.colors.surface,
    marginBottom: commonSpacing.md,
    borderRadius: commonRadius.lg,
  },
  buttonPrimary: {
    borderRadius: commonRadius.lg,
    elevation: 1,
    paddingVertical: commonSpacing.sm,
  },
  buttonSecondary: {
    borderRadius: commonRadius.lg,
    paddingVertical: commonSpacing.sm,
  },

  // Spacing
  divider: {
    marginVertical: commonSpacing.md,
    backgroundColor: theme.colors.surfaceVariant,
  },
  spacer: {
    height: commonSpacing.lg,
  },
  spacerSmall: {
    height: commonSpacing.sm,
  },

  // Layout
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: commonSpacing.md,
  },
  columnCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
