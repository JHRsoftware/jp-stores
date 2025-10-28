"use client";
import { createContext, useContext, useState, useEffect } from "react";

// Define all available themes
export const themes = {
  // Light themes
  light: {
    name: 'Light',
    mode: 'light',
    primary: '#007bff',
    colors: {
      background: '#e2dfdfff',
      backgroundSecondary: '#e3e5e7ff',
      backgroundTertiary: '#e9ecef',
      foreground: '#171717',
      foregroundSecondary: '#495057',
      border: '#e9ecef',
      borderHover: '#dee2e6',
      primary: '#007bff',
      primaryHover: '#0056b3',
      primaryLight: '#e3f2fd',
      success: '#28a745',
      successLight: '#d4edda',
      danger: '#dc3545',
      dangerLight: '#f8d7da',
      warning: '#ffc107',
      warningLight: '#fff3cd',
      info: '#17a2b8',
      infoLight: '#d1ecf1',
      card: '#f3f0f0ff',
      cardHover: '#f8f9fa',
      input: '#f3ececff',
      inputBorder: '#ced4da',
      shadow: 'rgba(0,0,0,0.1)',
      shadowMedium: 'rgba(0,0,0,0.15)',
      gradient: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)'
    }
  },
  
  // Dark theme
  dark: {
    name: 'Dark',
    mode: 'dark',
    primary: '#0d6efd',
    colors: {
      background: '#0a0a0a',
      backgroundSecondary: '#1a1a1a',
      backgroundTertiary: '#2d2d2d',
      foreground: '#ededed',
      foregroundSecondary: '#adb5bd',
      border: '#333333',
      borderHover: '#495057',
      primary: '#0d6efd',
      primaryHover: '#0b5ed7',
      primaryLight: '#1e3a8a',
      success: '#198754',
      successLight: '#0f3e1a',
      danger: '#dc3545',
      dangerLight: '#3e1117',
      warning: '#ffc107',
      warningLight: '#3e2e0a',
      info: '#17a2b8',
      infoLight: '#0a2e33',
      card: '#1a1a1a',
      cardHover: '#2d2d2d',
      input: '#2d2d2d',
      inputBorder: '#495057',
      shadow: 'rgba(0,0,0,0.3)',
      shadowMedium: 'rgba(0,0,0,0.4)',
      gradient: 'linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%)'
    }
  },
  
  // Red theme
  redLight: {
    name: 'Red Light',
    mode: 'light',
    primary: '#dc3545',
    colors: {
      background: '#ffffff',
      backgroundSecondary: '#fef7f7',
      backgroundTertiary: '#fdeaea',
      foreground: '#171717',
      foregroundSecondary: '#495057',
      border: '#f5c6cb',
      borderHover: '#f1b0b7',
      primary: '#dc3545',
      primaryHover: '#c82333',
      primaryLight: '#f8d7da',
      success: '#28a745',
      successLight: '#d4edda',
      danger: '#dc3545',
      dangerLight: '#f8d7da',
      warning: '#ffc107',
      warningLight: '#fff3cd',
      info: '#17a2b8',
      infoLight: '#d1ecf1',
      card: '#ffffff',
      cardHover: '#fef7f7',
      input: '#ffffff',
      inputBorder: '#f5c6cb',
      shadow: 'rgba(220,53,69,0.1)',
      shadowMedium: 'rgba(220,53,69,0.15)',
      gradient: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'
    }
  },
  
  redDark: {
    name: 'Red Dark',
    mode: 'dark',
    primary: '#ff6b7a',
    colors: {
      background: '#1a0a0a',
      backgroundSecondary: '#2d1414',
      backgroundTertiary: '#3e1e1e',
      foreground: '#ffeaea',
      foregroundSecondary: '#ffb3b3',
      border: '#4a2828',
      borderHover: '#5e3535',
      primary: '#ff6b7a',
      primaryHover: '#ff5e6e',
      primaryLight: '#4a1e23',
      success: '#28a745',
      successLight: '#0f3e1a',
      danger: '#ff6b7a',
      dangerLight: '#4a1e23',
      warning: '#ffc107',
      warningLight: '#3e2e0a',
      info: '#17a2b8',
      infoLight: '#0a2e33',
      card: '#2d1414',
      cardHover: '#3e1e1e',
      input: '#3e1e1e',
      inputBorder: '#5e3535',
      shadow: 'rgba(255,107,122,0.2)',
      shadowMedium: 'rgba(255,107,122,0.3)',
      gradient: 'linear-gradient(135deg, #ff6b7a 0%, #ff5e6e 100%)'
    }
  },
  
  // Green theme
  greenLight: {
    name: 'Green Light',
    mode: 'light',
    primary: '#28a745',
    colors: {
      background: '#ffffff',
      backgroundSecondary: '#f7fef7',
      backgroundTertiary: '#eafaea',
      foreground: '#171717',
      foregroundSecondary: '#495057',
      border: '#c3e6cb',
      borderHover: '#b8dfbc',
      primary: '#28a745',
      primaryHover: '#218838',
      primaryLight: '#d4edda',
      success: '#28a745',
      successLight: '#d4edda',
      danger: '#dc3545',
      dangerLight: '#f8d7da',
      warning: '#ffc107',
      warningLight: '#fff3cd',
      info: '#17a2b8',
      infoLight: '#d1ecf1',
      card: '#ffffff',
      cardHover: '#f7fef7',
      input: '#ffffff',
      inputBorder: '#c3e6cb',
      shadow: 'rgba(40,167,69,0.1)',
      shadowMedium: 'rgba(40,167,69,0.15)',
      gradient: 'linear-gradient(135deg, #28a745 0%, #218838 100%)'
    }
  },
  
greenDark: {
  name: 'Green Dark',
  mode: 'dark',
  primary: '#10b981', // Vibrant green for labels, highlights, buttons
  colors: {
    background: '#000000',           // Pure black background
    backgroundSecondary: '#0a0a0a',  // Slightly lighter black for depth
    backgroundTertiary: '#111111',   // For hover / card layers
    foreground: '#ffffff',           // White main text
    foregroundSecondary: '#cfcfcf',  // Light gray secondary text
    border: '#1b1b1b',               // Subtle dark border
    borderHover: '#10b981',          // Green border on hover
    primary: '#10b981',              // Main green accent
    primaryHover: '#10b981',         // Hover green
    primaryLight: '#163d2b',         // Dim green for light areas
    success: '#10b981',
    successLight: '#163d2b',
    danger: '#dc3545',
    dangerLight: '#3e1a1f',
    warning: '#ffc107',
    warningLight: '#3e320a',
    info: '#17a2b8',
    infoLight: '#0a2e33',
    card: '#0d0d0d',                 // Card background (slightly lighter than base)
    cardHover: '#161616',            // Hovered card
    input: '#111111',                // Input background
    inputBorder: '#10b981',          // Green border for inputs
    shadow: 'rgba(37,211,102,0.15)',
    shadowMedium: 'rgba(37,211,102,0.25)',
    gradient: 'linear-gradient(135deg, #10b981 0%, #10b981 100%)'
  }
},

  
  // Blue theme (enhanced)
  blueLight: {
    name: 'Blue Light',
    mode: 'light',
    primary: '#007bff',
    colors: {
      background: '#ffffff',
      backgroundSecondary: '#f7fbff',
      backgroundTertiary: '#eaf4ff',
      foreground: '#171717',
      foregroundSecondary: '#495057',
      border: '#b3d7ff',
      borderHover: '#99c7ff',
      primary: '#007bff',
      primaryHover: '#0056b3',
      primaryLight: '#e3f2fd',
      success: '#28a745',
      successLight: '#d4edda',
      danger: '#dc3545',
      dangerLight: '#f8d7da',
      warning: '#ffc107',
      warningLight: '#fff3cd',
      info: '#17a2b8',
      infoLight: '#d1ecf1',
      card: '#ffffff',
      cardHover: '#f7fbff',
      input: '#ffffff',
      inputBorder: '#b3d7ff',
      shadow: 'rgba(0,123,255,0.1)',
      shadowMedium: 'rgba(0,123,255,0.15)',
      gradient: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)'
    }
  },
  
  blueDark: {
    name: 'Blue Dark',
    mode: 'dark',
    primary: '#4dabf7',
    colors: {
      background: '#0a0f1a',
      backgroundSecondary: '#14202d',
      backgroundTertiary: '#1e2d3e',
      foreground: '#eaf4ff',
      foregroundSecondary: '#b3d7ff',
      border: '#284a5e',
      borderHover: '#355e78',
      primary: '#4dabf7',
      primaryHover: '#339af0',
      primaryLight: '#1e3a4a',
      success: '#28a745',
      successLight: '#0f3e1a',
      danger: '#dc3545',
      dangerLight: '#3e1117',
      warning: '#ffc107',
      warningLight: '#3e2e0a',
      info: '#4dabf7',
      infoLight: '#1e3a4a',
      card: '#14202d',
      cardHover: '#1e2d3e',
      input: '#1e2d3e',
      inputBorder: '#355e78',
      shadow: 'rgba(77,171,247,0.2)',
      shadowMedium: 'rgba(77,171,247,0.3)',
      gradient: 'linear-gradient(135deg, #4dabf7 0%, #339af0 100%)'
    }
  }
};

// Create the context
export const ThemeContext = createContext();

// Theme Provider Component
export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState('light');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize theme from localStorage
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('appTheme');
      if (savedTheme && themes[savedTheme]) {
        setCurrentTheme(savedTheme);
      }
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (isInitialized && typeof document !== 'undefined') {
      // Apply theme to document
      applyThemeToDocument(currentTheme);
      // Save to localStorage
      localStorage.setItem('appTheme', currentTheme);
    }
  }, [currentTheme, isInitialized]);

  const changeTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  const toggleMode = () => {
    const theme = themes[currentTheme];
    if (!theme) return;

    // Find corresponding light/dark theme
    if (theme.mode === 'light') {
      if (currentTheme === 'light') changeTheme('dark');
      else if (currentTheme === 'redLight') changeTheme('redDark');
      else if (currentTheme === 'greenLight') changeTheme('greenDark');
      else if (currentTheme === 'blueLight') changeTheme('blueDark');
    } else {
      if (currentTheme === 'dark') changeTheme('light');
      else if (currentTheme === 'redDark') changeTheme('redLight');
      else if (currentTheme === 'greenDark') changeTheme('greenLight');
      else if (currentTheme === 'blueDark') changeTheme('blueLight');
    }
  };

  const value = {
    currentTheme,
    theme: themes[currentTheme],
    changeTheme,
    toggleMode,
    themes,
    isInitialized
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use theme
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Function to apply theme to document
function applyThemeToDocument(themeName) {
  const theme = themes[themeName];
  if (!theme || typeof document === 'undefined') return;

  const root = document.documentElement;
  const { colors } = theme;

  // Apply CSS custom properties
  Object.entries(colors).forEach(([key, value]) => {
    const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    root.style.setProperty(cssVar, value);
  });

  // Set theme mode class
  document.body.className = `theme-${themeName} mode-${theme.mode}`;
  
  // Set data attributes for additional styling
  document.body.setAttribute('data-theme', themeName);
  document.body.setAttribute('data-mode', theme.mode);
}
