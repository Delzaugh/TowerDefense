import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './app/styles.css';

const element = document.getElementById('root');
if (!element) throw new Error('Missing application root.');
createRoot(element).render(<StrictMode><App /></StrictMode>);
