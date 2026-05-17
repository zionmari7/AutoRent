// src/theme/index.ts
export const Colors = {
  brand:    '#0f172a',
  accent:   '#f43f5e',
  accent2:  '#0ea5e9',
  surface:  '#ffffff',
  surface2: '#f8fafc',
  surface3: '#f1f5f9',
  text:     '#0f172a',
  text2:    '#64748b',
  text3:    '#94a3b8',
  border:   'rgba(15,23,42,0.10)',
  green:    '#22c55e',
  red:      '#ef4444',
  blue:     '#3b82f6',
  yellow:   '#f59e0b',
  purple:   '#8b5cf6',
};

export const FontSize = {
  xs:   11,
  sm:   12,
  base: 14,
  md:   15,
  lg:   17,
  xl:   20,
  xxl:  26,
};

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
};

export const Radius = {
  sm:  6,
  md:  10,
  lg:  14,
  full: 999,
};

export const Shadow = {
  sm: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 6,
  },
};

export const VEHICLE_EMOJIS: Record<string, string> = {
  'Sedan':    '🚗',
  'SUV':      '🚙',
  'Hatchback':'🚗',
  'Van / MPV':'🚐',
  'Pickup':   '🛻',
};

export const AVATAR_COLORS = [
  '#f43f5e','#3b82f6','#22c55e','#f59e0b',
  '#8b5cf6','#06b6d4','#f97316','#10b981',
];
