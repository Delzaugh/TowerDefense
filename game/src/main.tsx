import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { ThemeProvider } from './ui/toolkit';
import '@fontsource-variable/mona-sans';
import './app/base.css';

const element = document.getElementById('root');
if (!element) throw new Error('Missing application root.');
createRoot(element).render(<StrictMode><ThemeProvider><App /></ThemeProvider></StrictMode>);
window.dispatchEvent(new Event('tower:mounted'));
