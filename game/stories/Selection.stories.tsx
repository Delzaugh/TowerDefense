import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { HomeIcon, ScreenFullIcon } from '@primer/octicons-react';
import { fn } from 'storybook/test';
import { SegmentedControl } from '../src/ui/toolkit';

const options = [{ value: 'home', label: 'Home', icon: <HomeIcon /> }, { value: 'top', label: 'Top', icon: <ScreenFullIcon /> }, { value: 'orbit', label: 'Orbit', disabled: true }];
const meta = {
  title: 'Field Kit/Selection', component: SegmentedControl,
  args: { label: 'Camera view', value: 'home', options, onChange: fn() },
  parameters: { docs: { description: { component: 'A labeled group of native pressed buttons. This is a choice control, not a tablist: use Tab to focus choices and Space or Enter to select. The caller owns the selected value. Disabled options remain visible and noninteractive.' } } },
} satisfies Meta<typeof SegmentedControl>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Interactive: Story = { render: function Interactive(args) {
  const [value, setValue] = useState(args.value);
  return <div className="workshop-stack"><SegmentedControl {...args} value={value} onChange={next => { setValue(next); args.onChange(next); }} /><p role="status">View: {value}</p></div>;
} };
export const Disabled: Story = { args: { disabled: true } };
