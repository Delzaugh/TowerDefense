import { resolveStorySpeakerPortrait, type StorySpeakerPortraitResolver } from './portraits/speakerPortraits';

interface StoryDialogueProps {
  readonly caption: string;
  readonly speaker: string | null;
  readonly resolvePortrait?: StorySpeakerPortraitResolver | undefined;
}

/** Instant, fixed-layout speaker identification also works when the speaker is off-screen. */
export function StoryDialogue({ caption, speaker, resolvePortrait = resolveStorySpeakerPortrait }: StoryDialogueProps) {
  const active = !!caption && caption !== 'TO BE CONTINUED';
  const portrait = active ? resolvePortrait(speaker) : null;
  const name = portrait?.name ?? speaker ?? 'Narrator';
  return <div className="story-dialogue" data-testid="story-dialogue" data-active={active}
    data-speaker={portrait?.id ?? (speaker ? 'unknown' : 'narrator')} data-accent={portrait?.accent ?? 'neutral'}
    data-has-portrait={!!portrait}>
    {portrait && <span className="story-dialogue-portrait" aria-hidden="true">
      <img key={portrait.imageUrl} src={portrait.imageUrl} alt="" draggable={false} width={64} height={64}
        data-testid="story-dialogue-avatar" data-asset-id={portrait.assetId} />
    </span>}
    <div className="story-dialogue-copy" aria-live="polite" aria-atomic="true">
      <span className="story-dialogue-name" data-testid="story-dialogue-name">{active ? name : ''}</span>
      <p className="story-dialogue-text" data-testid="story-dialogue-text">{active ? caption : ''}</p>
    </div>
  </div>;
}
