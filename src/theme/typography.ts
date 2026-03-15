import { TextStyle } from 'react-native';
import { colors } from './colors';

type Typography = {
  heading: TextStyle;
  body: TextStyle;
  caption: TextStyle;
};

export const typography: Typography = {
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  body: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  caption: {
    fontSize: 13,
    color: colors.textSecondary,
  },
};

