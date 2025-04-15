import React, { createContext, useState, useMemo, useContext, useEffect, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline, PaletteMode } from '@mui/material';
import { getTheme } from '../theme'; // Adjust path if necessary

interface ThemeContextType {
  mode: PaletteMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleTheme: () => console.warn('ThemeProvider not found'),
});

export const useThemeContext = () => useContext(ThemeContext);

interface CustomThemeProviderProps {
    children: ReactNode;
}

export const CustomThemeProvider: React.FC<CustomThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<PaletteMode>(() => {
      try {
          const storedMode = localStorage.getItem('themeMode') as PaletteMode | null;
          return storedMode === 'dark' ? 'dark' : 'light';
      } catch {
          return 'light';
      }
  });

  useEffect(() => {
      try {
        localStorage.setItem('themeMode', mode);
        console.log(`[ThemeContext] Theme mode saved: ${mode}`);
      } catch (error) {
          console.error("[ThemeContext] Failed to save theme mode:", error);
      }
  }, [mode]);

  const toggleTheme = useMemo(() => () => {
      setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          console.log(`[ThemeContext] Toggling theme to ${newMode}`);
          return newMode;
      });
  }, []);

  const theme = useMemo(() => getTheme(mode), [mode]);
  const contextValue = useMemo(() => ({ mode, toggleTheme }), [mode, toggleTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
