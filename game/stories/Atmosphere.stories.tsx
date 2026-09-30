import type { Meta, StoryObj } from '@storybook/react-vite';
import { ModelPreviewBackdrop, PageAtmosphere, StatusBadge, Surface } from '../src/ui/toolkit';
import { useWorkshopMotion } from './Workshop';

const meta = {
  title: 'Field Kit/Atmosphere', component: PageAtmosphere,
  parameters: { layout: 'fullscreen', docs: { description: { component: 'PageAtmosphere sits behind whole menu pages; ModelPreviewBackdrop supplies decorative depth inside model cards. Neither owns model framing or encodes gameplay coverage. Both honor animated=false and the OS reduced-motion setting. Use the Motion toolbar to preview the game preference.' } } },
} satisfies Meta<typeof PageAtmosphere>;
export default meta;
type Story = StoryObj<typeof meta>;

function AmbientPage() {
  const reduced = useWorkshopMotion();
  return <main className="workshop-page"><PageAtmosphere animated={!reduced} /><div className="workshop-page__content">
    <div className="workshop-stack"><StatusBadge>THE COPILOT LAB</StatusBadge><h1>Space for your specialists</h1><p>Ambient page light behind clear, readable panels.</p></div>
    <div className="workshop-grid"><Surface className="workshop-preview"><ModelPreviewBackdrop animated={!reduced} /><div className="workshop-preview__caption"><h2>Model field</h2><p>Decorative depth. The live tower and camera belong to the game.</p></div></Surface>
      <Surface className="workshop-panel"><h2>Independent layers</h2><p>The page atmosphere surrounds menus. The model backdrop stays inside its card. Content and controls keep their own input.</p></Surface></div>
  </div></main>;
}
export const Page: Story = { render: () => <AmbientPage /> };
export const ReducedMotion: Story = { ...Page, globals: { motion: 'reduce' } };
