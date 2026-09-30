import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowLeftIcon, GearIcon, UnmuteIcon } from '@primer/octicons-react';
import { Button, GameTopBar, IconButton, ThemePicker, type GameTopBarProps } from '../src/ui/toolkit';

const meta = {
  title: 'Field Kit/GameTopBar', component: GameTopBar,
  args: { leading: null, location: 'Copilot Lab', context: 'Tower inspection' },
  argTypes: { leading: { control: false }, trailing: { control: false } },
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Shared three-slot game chrome. The screen supplies escape, location and utility actions; it owns routes, modal focus, keyboard shortcuts and gameplay input. Keep the world as the primary subject. Viewport examples exercise real CSS breakpoints; the world plate here is a documentation fixture.' } } },
} satisfies Meta<typeof GameTopBar>;
export default meta;
type Story = StoryObj<typeof meta>;

function InspectionHeader(args: GameTopBarProps) {
  const [action, setAction] = useState('Inspection ready');
  return <div><GameTopBar {...args} leading={<Button variant="quiet" onClick={() => setAction('Back to Hub selected')}><ArrowLeftIcon /> Back to Hub <kbd className="ui-game-topbar__shortcut">Esc</kbd></Button>}
    trailing={<ThemePicker className="ui-game-topbar__appearance" />} />
    <p role="status" style={{ padding: 16 }}>{action}</p></div>;
}
export const Inspection: Story = { render: args => <InspectionHeader {...args} /> };
export const Phone: Story = { ...Inspection, globals: { viewport: { value: 'phoneSmall', isRotated: false } } };
export const Landscape: Story = { ...Inspection, globals: { viewport: { value: 'landscape', isRotated: false } } };
export const World: Story = {
  args: { presentation: 'world', leading: <strong>Copilot TD</strong>, location: 'Copilot Hub', context: 'Prepare your next mission', trailing: <><IconButton aria-label="Ambient sound" aria-pressed="true"><UnmuteIcon /></IconButton><IconButton aria-label="Settings"><GearIcon /></IconButton></> },
  render: args => <div className="workshop-world"><GameTopBar {...args} /></div>,
};
