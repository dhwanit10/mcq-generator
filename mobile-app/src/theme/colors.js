/**
 * Theme Color Palette: "Obsidian & Forest Emerald"
 *
 * Strict Color Constraints:
 * - NO shades of blue, violet, pink, purple, or red.
 * - Primary Palette: Emerald Green (#059669, #10B981) + Obsidian Dark (#121413, #1A1E1B)
 * - Accent Palette: Warm Amber & Gold (#D97706, #F59E0B)
 * - Alert / Error Palette: Burnished Ochre / Rust Amber (#C2410C, #9A3412 - completely non-red)
 * - Surface / Neutral: Crisp Off-White & Sage Neutrals (#FAFCFA, #EDF2EE, #DFE6E1)
 */

export const colors = {
  // Background surfaces
  background: '#F5F7F5',
  surface: '#FFFFFF',
  surfaceSecondary: '#EDF2EE',
  surfaceDark: '#121413',
  surfaceDarkCard: '#1A1E1B',
  surfaceDarkAccent: '#232825',

  // Emerald primary accents
  primary: '#059669',
  primaryLight: '#10B981',
  primaryDark: '#047857',
  primaryDeep: '#064E3B',
  primaryMuted: '#ECFDF5',
  primaryBorder: '#A7F3D0',

  // Amber / Gold secondary accents
  accent: '#D97706',
  accentLight: '#F59E0B',
  accentDark: '#B45309',
  accentMuted: '#FEF3C7',
  accentBorder: '#FDE68A',

  // Alert / Warning / Error (Burnished Terracotta & Ochre - no red)
  warning: '#D97706',
  warningBackground: '#FEF3C7',
  error: '#C2410C',
  errorBackground: '#FFEDD5',
  errorBorder: '#FDBA74',

  // Neutrals & borders
  border: '#DFE6E1',
  borderDark: '#2E3430',
  borderLight: '#EDF2EE',

  // Text
  text: '#111813',
  textSecondary: '#556057',
  textMuted: '#758277',
  textLight: '#FAFCFA',
  textLightMuted: '#9AA79D',
};

export default colors;
