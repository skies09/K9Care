import React from 'react';
import {
  Pressable,
  TouchableOpacity,
  Text,
  StyleSheet,
  GestureResponderEvent,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fonts } from '../../theme/typography';
import { radius } from '../../theme/layout';

type Variant = 'primary' | 'secondary' | 'danger' | 'inverse' | 'onboarding';
type Size = 'default' | 'large';

type ButtonPalette = {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  textColor: string;
  containerOpacity?: number;
  shadow?: boolean;
};

type Props = {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: Variant;
  size?: Size;
  style?: ViewStyle;
  disabled?: boolean;
};

function getButtonColors(variant: Variant, disabled: boolean): ButtonPalette {
  if (variant === 'onboarding') {
    if (disabled) {
      return {
        backgroundColor: colors.secondary,
        borderColor: 'transparent',
        borderWidth: 0,
        textColor: 'rgba(255, 255, 255, 0.7)',
        shadow: false,
      };
    }
    return {
      backgroundColor: colors.primary,
      borderColor: 'transparent',
      borderWidth: 0,
      textColor: colors.textOnPrimary,
      shadow: true,
    };
  }

  const backgroundColor =
    variant === 'inverse'
      ? colors.cardBackground
      : variant === 'danger'
        ? colors.accent
        : variant === 'secondary'
          ? colors.secondary
          : colors.primary;

  const textColor =
    variant === 'inverse' ? colors.primary : colors.textOnPrimary;

  return {
    backgroundColor,
    borderColor: 'transparent',
    borderWidth: 0,
    textColor,
    containerOpacity: disabled ? 0.55 : 1,
  };
}

const onboardingShadow = {
  shadowColor: colors.shadow,
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.12,
  shadowRadius: 3,
  elevation: 2,
} as const;

export const Button: React.FC<Props> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'default',
  style,
  disabled = false,
}) => {
  const palette = getButtonColors(variant, disabled);
  const isOnboarding = variant === 'onboarding';

  if (isOnboarding) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        style={({ pressed }) => [
          styles.button,
          styles.buttonOnboarding,
          size === 'large' && styles.buttonOnboardingLarge,
          palette.shadow && onboardingShadow,
          {
            backgroundColor: disabled
              ? palette.backgroundColor
              : pressed
                ? colors.primaryDark
                : palette.backgroundColor,
            borderColor: palette.borderColor,
            borderWidth: palette.borderWidth,
          },
          pressed && !disabled && styles.buttonOnboardingPressed,
          style,
        ]}
      >
        <Text
          style={[
            styles.text,
            size === 'large' && styles.textLarge,
            styles.textOnboarding,
            { color: palette.textColor },
          ]}
        >
          {title}
        </Text>
      </Pressable>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        size === 'large' && styles.buttonLarge,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          borderWidth: palette.borderWidth,
          opacity: palette.containerOpacity ?? 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.85}
      accessibilityState={{ disabled }}
    >
      <Text
        style={[
          styles.text,
          size === 'large' && styles.textLarge,
          { color: palette.textColor },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonLarge: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg + 4,
    minHeight: 52,
  },
  buttonOnboarding: {
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minHeight: 48,
  },
  buttonOnboardingLarge: {
    minHeight: 52,
  },
  buttonOnboardingPressed: {
    transform: [{ scale: 0.98 }],
  },
  text: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    fontWeight: '600',
  } satisfies TextStyle,
  textLarge: {
    fontSize: 18,
    lineHeight: 24,
  },
  textOnboarding: {
    fontFamily: fonts.headingSemi,
    fontWeight: '600',
  },
});
