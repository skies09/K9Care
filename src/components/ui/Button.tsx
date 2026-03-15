import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  GestureResponderEvent,
  ViewStyle,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type Variant = 'primary' | 'secondary' | 'danger';

type Props = {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: Variant;
  style?: ViewStyle;
  disabled?: boolean;
};

export const Button: React.FC<Props> = ({
  title,
  onPress,
  variant = 'primary',
  style,
  disabled,
}) => {
  const backgroundColor =
    variant === 'primary' || variant === 'secondary'
      ? colors.primaryBlue
      : variant === 'danger'
      ? colors.danger
      : colors.primaryBlue;

  const textColor = '#FFFFFF';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor, opacity: disabled ? 0.6 : 1 },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});

