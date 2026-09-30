import type { Meta, StoryObj } from '@storybook/react-vite';
import { CpuIcon, ZapIcon } from '@primer/octicons-react';
import { StatGauge, StatusBadge, Surface } from '../src/ui/toolkit';

const meta = {
  title: 'Field Kit/Feedback', component: StatGauge,
  args: { label: 'Work', value: 75, caption: 'Illustrative throughput.' },
  parameters: { docs: { description: { component: 'Gauges are accessible noninteractive meters. Use numeric values for known quantities or qualitative segments with valueText for inspection. Captions explain meaning without relying on color. Badges label a state; callers own live announcements. Surface adds appearance, not layout or section semantics.' } } },
} satisfies Meta<typeof StatGauge>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
export const Capabilities: Story = { render: () => <Surface className="workshop-panel" style={{ maxWidth: 420 }}>
  <h2>Capabilities</h2><StatGauge label="Damage" icon={<ZapIcon />} value={50} segments={8} showValue={false} valueText="Solid impact" caption="A solid impact on each hit." />
  <StatGauge label="Compute" icon={<CpuIcon />} value={88} segments={8} tone="positive" showValue={false} valueText="Substantial investment" caption="A substantial initial investment." />
  <StatGauge label="Empty" value={0} caption="No progress yet." /><StatGauge label="Complete" value={100} tone="positive" caption="All work completed." />
  <div className="workshop-row"><StatusBadge>Preview</StatusBadge><StatusBadge tone="positive">Ready</StatusBadge><StatusBadge tone="attention">Paused</StatusBadge><StatusBadge tone="danger">Unavailable</StatusBadge></div>
</Surface> };
