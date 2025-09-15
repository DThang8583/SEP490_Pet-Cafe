// Color constants for the Pet Cafe application

export const PRIMARY = {
    50: '#e6f4ff',
    100: '#cce8ff',
    200: '#99d1ff',
    300: '#66baff',
    400: '#33a3ff',
    500: '#008cff', // Main primary blue
    600: '#0070cc',
    700: '#005499',
    800: '#003866',
    900: '#001c33',
};

export const SECONDARY = {
    50: '#fff5e6',
    100: '#ffebcc',
    200: '#ffd799',
    300: '#ffc366',
    400: '#ffaf33',
    500: '#ff8c42', // Main secondary orange
    600: '#e67e22',
    700: '#cc7000',
    800: '#b36200',
    900: '#995400',
};

export const GRAY = {
    50: '#f8f9fa',
    100: '#f1f3f4',
    200: '#e8eaed',
    300: '#dadce0',
    400: '#bdc1c6',
    500: '#9aa0a6',
    600: '#80868b',
    700: '#5f6368',
    800: '#3c4043',
    900: '#202124',
};

export const SUCCESS = {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#27ae60',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
};

export const WARNING = {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f39c12',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
};

export const ERROR = {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#e74c3c',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
};

export const INFO = {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#5dade2',
    600: '#3498db',
    700: '#2980b9',
    800: '#1f618d',
    900: '#154360',
};

export const COMMON = {
    WHITE: '#ffffff',
    BLACK: '#2c3e50',
    RED: '#e74c3c',
    TRANSPARENT: 'transparent',
};

export const TEXT = {
    PRIMARY: GRAY[800],
    SECONDARY: GRAY[600],
    DISABLED: GRAY[400],
    INVERSE: COMMON.WHITE,
};

export const BACKGROUND = {
    DEFAULT: COMMON.WHITE,
    PAPER: COMMON.WHITE,
    NEUTRAL: GRAY[50],
    DISABLED: GRAY[100],
    DARK: GRAY[800],
};

export const BORDER = {
    DEFAULT: GRAY[200],
    LIGHT: GRAY[100],
    DARK: GRAY[300],
    PRIMARY: PRIMARY[300],
    SECONDARY: SECONDARY[300],
};

export const SHADOW = {
    DEFAULT: 'rgba(0, 0, 0, 0.1)',
    LIGHT: 'rgba(0, 0, 0, 0.05)',
    MEDIUM: 'rgba(0, 0, 0, 0.15)',
    DARK: 'rgba(0, 0, 0, 0.25)',
    PRIMARY: 'rgba(0, 140, 255, 0.2)',
    SECONDARY: 'rgba(255, 140, 66, 0.2)',
};

export const OVERLAY = {
    LIGHT: 'rgba(255, 255, 255, 0.8)',
    MEDIUM: 'rgba(255, 255, 255, 0.5)',
    DARK: 'rgba(0, 0, 0, 0.5)',
    DARKER: 'rgba(0, 0, 0, 0.7)',
    PRIMARY: 'rgba(0, 140, 255, 0.1)',
    SECONDARY: 'rgba(255, 140, 66, 0.1)',
};

export const COLORS = {
    PRIMARY,
    SECONDARY,
    GRAY,
    SUCCESS,
    WARNING,
    ERROR,
    INFO,
    COMMON,
    TEXT,
    BACKGROUND,
    BORDER,
    SHADOW,
    OVERLAY
};

export default COLORS;
