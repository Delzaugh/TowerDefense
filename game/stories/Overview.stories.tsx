import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowRightIcon, GearIcon, ZapIcon } from '@primer/octicons-react';
import { Button, IconButton, StatGauge, StatusBadge, Surface, ThemePicker } from '../src/ui/toolkit';

const meta = {
  title: 'Field Kit/Overview',
  parameters: { docs: { description: { component: 'The Tower Field kit: Primer-inspired controls around a game world. All examples import the shipped components. Use the Appearance, Motion and Viewport tools to review them. The design contract is docs/design/UI_Field_Kit.md; these examples do not define gameplay tuning.' } } },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const FieldKit: Story = {
  render: () => <main className="workshop-stack">
    <div className="workshop-stack"><StatusBadge>GAME UI WORKSHOP</StatusBadge><h1>Copilot Field kit</h1>
      <p>Clear controls. Space for the world. Shared foundations for the next mission, menu and specialist.</p></div>
    <div className="workshop-grid">
      <Surface className="workshop-panel"><h2>Mission actions</h2><p>Green marks the next meaningful action. Utility controls stay quiet.</p>
        <div className="workshop-row"><Button variant="primary">Deploy <ArrowRightIcon /></Button><Button>Inspect towers</Button><IconButton aria-label="Settings"><GearIcon /></IconButton></div>
        <div className="workshop-row"><StatusBadge tone="positive">Ready</StatusBadge><StatusBadge tone="attention">Upgrade available</StatusBadge></div>
      </Surface>
      <Surface className="workshop-panel"><h2>Readable capabilities</h2>
        <StatGauge label="Damage" icon={<ZapIcon />} value={50} segments={8} showValue={false} valueText="Solid impact" caption="Illustrative capability, not a balance value." />
        <ThemePicker />
      </Surface>
    </div>
    <Surface className="workshop-panel"><h2>Review a change</h2><p>Browse states, try keyboard focus, switch both themes, then resize the viewport. Validate world input, model framing and real menus in the game.</p></Surface>
  </main>,
};
