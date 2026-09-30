import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GearIcon, PlayIcon, SyncIcon } from '@primer/octicons-react';
import { fn } from 'storybook/test';
import { Button, IconButton } from '../src/ui/toolkit';

const meta = {
  title: 'Field Kit/Buttons', component: Button,
  args: { children: 'Deploy', variant: 'primary', onClick: fn() },
  argTypes: { variant: { control: 'select', options: ['primary', 'secondary', 'quiet', 'danger'] } },
  parameters: { docs: { description: { component: 'Native button attributes and refs pass through. Primary green is reserved for the next meaningful action. Disabled, pressed and keyboard-focus states belong to the component; pending work and action semantics belong to the caller. IconButton requires an action label.' } } },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};

function ButtonStates() {
  const [playing, setPlaying] = useState(false);
  return <div className="workshop-stack">
    <div className="workshop-row"><Button variant="primary">Deploy</Button><Button>Inspect towers</Button><Button variant="quiet">Back to Hub</Button><Button variant="danger">Abandon run</Button></div>
    <div className="workshop-row"><Button disabled>Unavailable</Button><Button variant="primary" disabled>Deploy</Button><Button disabled aria-busy="true"><SyncIcon /> Loading models</Button></div>
    <div className="workshop-row"><Button aria-pressed={playing} onClick={() => setPlaying(!playing)}><PlayIcon /> Auto preview</Button><IconButton aria-label="Settings"><GearIcon /></IconButton><IconButton aria-label="Settings unavailable" disabled><GearIcon /></IconButton></div>
    <p role="status">Auto preview {playing ? 'on' : 'off'}</p>
  </div>;
}
export const States: Story = { render: () => <ButtonStates /> };
