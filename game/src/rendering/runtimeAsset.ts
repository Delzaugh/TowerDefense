/** Browser projection of a delivered asset. Authoring metadata stays in the repository. */
export interface RuntimeAsset {
  readonly id: string;
  readonly version: string;
  readonly revision: number;
  readonly category: string;
  readonly url: string;
  readonly sha256: string;
  readonly bytes: number;
  readonly contract: {
    readonly root: string;
    readonly up: '+Y';
    readonly forward: '+Z';
    readonly metres: true;
    readonly rootMotion: false;
    readonly anchors: readonly string[];
  };
  readonly clips: readonly {
    readonly name: string;
    readonly playback: 'loop' | 'once';
    readonly fps: number;
  }[];
}
