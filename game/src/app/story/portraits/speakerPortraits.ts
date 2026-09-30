import copilotPortrait from '../../showcase/portraits/base.png';
import octocatPortrait from './octocat.png';

export interface StorySpeakerPortrait {
  readonly id: string;
  readonly name: string;
  readonly imageUrl: string;
  readonly assetId: string;
  readonly accent: 'copilot' | 'octocat' | 'neutral';
}

/** Future appearance assembly can supply portraits for the current customized models. */
export type StorySpeakerPortraitResolver = (speaker: string | null) => StorySpeakerPortrait | null;

const portraits: Readonly<Record<string, StorySpeakerPortrait>> = {
  'Base Copilot': { id: 'copilot', name: 'Copilot', imageUrl: copilotPortrait, assetId: 'copilot_base', accent: 'copilot' },
  Copilot: { id: 'copilot', name: 'Copilot', imageUrl: copilotPortrait, assetId: 'copilot_base', accent: 'copilot' },
  Octocat: { id: 'octocat', name: 'Octocat', imageUrl: octocatPortrait, assetId: 'copilot_octocat_classic_lowpoly', accent: 'octocat' },
};

export const resolveStorySpeakerPortrait: StorySpeakerPortraitResolver = speaker => speaker ? portraits[speaker] ?? null : null;
