import { useEffect, type ReactNode } from 'react';
import type { Preview } from '@storybook/react-vite';
import '@fontsource-variable/mona-sans';
import { ThemeProvider, useTheme, type ThemePreference } from '../src/ui/toolkit';
import { WorkshopMotion } from '../stories/Workshop';
import '../stories/workshop.css';

function Appearance({ preference, children }: { preference: ThemePreference; children: ReactNode }) {
  const { setPreference } = useTheme();
  useEffect(() => { setPreference(preference); }, [preference, setPreference]);
  return children;
}

const preview: Preview = {
  tags: ['autodocs'],
  initialGlobals: { theme: 'light', motion: 'system' },
  globalTypes: {
    theme: {
      description: 'Game appearance',
      toolbar: { title: 'Appearance', icon: 'circlehollow', dynamicTitle: true, items: [
        { value: 'light', title: 'Light' }, { value: 'dark', title: 'Dark' }, { value: 'system', title: 'System' },
      ] },
    },
    motion: {
      description: 'System respects the OS; Reduced also passes the game preference to decorative layers.',
      toolbar: { title: 'Motion', icon: 'play', dynamicTitle: true, items: [
        { value: 'system', title: 'System motion' }, { value: 'reduce', title: 'Reduced motion' },
      ] },
    },
  },
  parameters: {
    layout: 'padded',
    backgrounds: { disable: true },
    controls: { expanded: true },
    viewport: { options: {
      phoneSmall: { name: 'Small phone', styles: { width: '320px', height: '568px' }, type: 'mobile' },
      phone: { name: 'Phone', styles: { width: '390px', height: '844px' }, type: 'mobile' },
      landscape: { name: 'Phone landscape', styles: { width: '844px', height: '390px' }, type: 'mobile' },
      tablet: { name: 'Tablet', styles: { width: '1024px', height: '768px' }, type: 'tablet' },
      desktop: { name: 'Desktop', styles: { width: '1600px', height: '1000px' }, type: 'desktop' },
    } },
    a11y: { test: 'error' },
    options: { storySort: { order: ['Field Kit', ['Overview', 'Buttons', 'Forms', 'Selection', 'Feedback', 'GameTopBar', 'Atmosphere']] } },
  },
  decorators: [(Story, context) => {
    const preference = context.globals.theme === 'dark' ? 'dark' : context.globals.theme === 'system' ? 'system' : 'light';
    const reduced = context.globals.motion === 'reduce';
    return <ThemeProvider><Appearance preference={preference}>
      <WorkshopMotion value={reduced}>
        <div className="workshop" data-motion={reduced ? 'reduce' : 'system'}><Story /></div>
      </WorkshopMotion>
    </Appearance></ThemeProvider>;
  }],
};
export default preview;
