import { createContext, useContext, useState, useEffect } from 'react';
import { themes, defaultTheme } from './themes';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(() => {
    return localStorage.getItem('mediacrush-theme') || defaultTheme;
  });

  useEffect(() => {
    const theme = themes[themeName] || themes[defaultTheme];
    const root = document.documentElement;
    Object.entries(theme).forEach(([key, value]) => {
      if (key.startsWith('--')) root.style.setProperty(key, value);
    });
    localStorage.setItem('mediacrush-theme', themeName);
  }, [themeName]);

  return (
    <ThemeContext.Provider value={{ theme: themes[themeName], themeName, setTheme: setThemeName }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
