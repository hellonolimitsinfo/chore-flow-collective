
import { createRoot } from 'react-dom/client';
import { useTheme } from '@/hooks/useTheme';
import { useEffect } from 'react';
import App from './App.tsx';
import './index.css';

const ThemedApp = () => {
  const { theme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return <App />;
};

createRoot(document.getElementById("root")!).render(<ThemedApp />);
