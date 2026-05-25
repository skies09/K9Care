import { ViewStyle } from 'react-native';
import { colors } from './colors';

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const cardShadow: ViewStyle = {
  shadowColor: colors.shadow,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3,
};

export const screenContainer: ViewStyle = {
  flex: 1,
  backgroundColor: colors.background,
};
