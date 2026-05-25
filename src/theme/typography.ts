import { TextStyle } from 'react-native';
import { colors } from './colors';

export const fonts = {
  headingSemi: 'Poppins_600SemiBold',
  headingBold: 'Poppins_700Bold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
} as const;

export const textStyles = {
  screenTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  sectionTitle: {
    fontFamily: fonts.headingBold,
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  cardTitle: {
    fontFamily: fonts.headingSemi,
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textSecondary,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.textPrimary,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    fontWeight: '500' as const,
    color: colors.textPrimary,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  button: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  brand: {
    fontFamily: fonts.headingBold,
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.textOnPrimary,
  },
} satisfies Record<string, TextStyle>;

/** @deprecated Use `textStyles` / `fonts` */
export const typography = {
  heading: textStyles.screenTitle,
  body: textStyles.body,
  caption: textStyles.caption,
};
