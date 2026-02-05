/**
 * GigChain Pay Theme Colors
 * Dark theme with cyan accents matching the Hedera Network branding
 */

import { Platform } from 'react-native';

// Brand Colors
const primaryCyan = '#00D9FF';
const darkBackground = '#0A1F2B';
const cardBackground = '#1A3544';
const secondaryBackground = '#152B38';

export const Colors = {
  light: {
    text: '#FFFFFF',
    textSecondary: '#8B9BA8',
    background: darkBackground,
    surface: cardBackground,
    card: cardBackground,
    tint: primaryCyan,
    primary: primaryCyan,
    secondary: '#2D4A5C',
    accent: primaryCyan,
    success: '#00FF94',
    error: '#FF4757',
    warning: '#FFA502',
    border: '#2D4A5C',
    icon: '#8B9BA8',
    tabIconDefault: '#8B9BA8',
    tabIconSelected: primaryCyan,
    buttonPrimary: primaryCyan,
    buttonSecondary: secondaryBackground,
    inputBackground: '#1A3544',
    inputBorder: '#2D4A5C',
    placeholder: '#6B7B88',
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#8B9BA8',
    background: darkBackground,
    surface: cardBackground,
    card: cardBackground,
    tint: primaryCyan,
    primary: primaryCyan,
    secondary: '#2D4A5C',
    accent: primaryCyan,
    success: '#00FF94',
    error: '#FF4757',
    warning: '#FFA502',
    border: '#2D4A5C',
    icon: '#8B9BA8',
    tabIconDefault: '#8B9BA8',
    tabIconSelected: primaryCyan,
    buttonPrimary: primaryCyan,
    buttonSecondary: secondaryBackground,
    inputBackground: '#1A3544',
    inputBorder: '#2D4A5C',
    placeholder: '#6B7B88',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
