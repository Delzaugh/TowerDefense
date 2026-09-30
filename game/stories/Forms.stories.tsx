import { useId, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input, Select, Surface, ThemePicker } from '../src/ui/toolkit';

const meta = {
  title: 'Field Kit/Forms', component: Input,
  args: { 'aria-label': 'Squad name', placeholder: 'Name your squad' },
  parameters: { docs: { description: { component: 'Compose native Input and Select with real labels and helper text. Checkboxes and radios need a labeled 44px hit area from the caller. ThemePicker uses the real provider and storage behavior; System follows OS appearance. Validation and persisted game settings stay outside the toolkit.' } } },
} satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};

function FormStates() {
  const id = useId();
  const [name, setName] = useState('Field team');
  return <div className="workshop-grid">
    <Surface className="workshop-panel">
      <div className="workshop-field"><label htmlFor={`${id}-name`}>Squad name</label><Input id={`${id}-name`} value={name} onChange={event => setName(event.target.value)} /></div>
      <div className="workshop-field"><label htmlFor={`${id}-view`}>Camera view</label><Select id={`${id}-view`} defaultValue="home"><option value="home">Home</option><option value="top">Top</option></Select></div>
      <label className="workshop-check"><Input type="checkbox" defaultChecked /> Ambient sound</label>
      <div role="group" aria-label="Preview speed"><label className="workshop-check"><Input type="radio" name={`${id}-speed`} defaultChecked /> Normal</label><label className="workshop-check"><Input type="radio" name={`${id}-speed`} /> Slow</label></div>
      <p role="status">Squad: {name || 'Unnamed'}</p>
    </Surface>
    <Surface className="workshop-panel">
      <div className="workshop-field"><label htmlFor={`${id}-disabled`}>Locked setting</label><Input id={`${id}-disabled`} disabled value="Available later" /></div>
      <div className="workshop-field"><label htmlFor={`${id}-invalid`}>Import code</label><Input id={`${id}-invalid`} defaultValue="unknown" aria-invalid="true" aria-describedby={`${id}-error`} /><p id={`${id}-error`} className="workshop-error">Use a code from your saved blueprint.</p></div>
      <label className="workshop-check"><Input type="checkbox" disabled /> Unavailable option</label>
      <ThemePicker />
    </Surface>
  </div>;
}
export const States: Story = { render: () => <FormStates /> };
