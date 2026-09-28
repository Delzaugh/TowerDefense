import { useState } from 'react';
import { EncounterLab } from './EncounterLab';
import type { WaveRecipe } from '../content/waveRecipe';
import './styles.css';

export function LabScreen() {
  const query = new URLSearchParams(window.location.search);
  const [preset, setPreset] = useState(query.get('preset') === 'fragile' || query.get('fixture') === 'fragile' ? 'fragile' : 'standard');
  const [recipe, setRecipe] = useState<WaveRecipe | undefined>(undefined);
  return <div className="lab-screen">
    <EncounterLab key={preset} fixture={preset} initialRecipe={recipe} onPreset={(value, appliedRecipe) => {
      const url = new URL(window.location.href);
      url.search = value === 'fragile' ? '?preset=fragile' : '';
      url.hash = '/lab';
      window.history.replaceState(null, '', url);
      setPreset(value); setRecipe(appliedRecipe);
    }} />
  </div>;
}
