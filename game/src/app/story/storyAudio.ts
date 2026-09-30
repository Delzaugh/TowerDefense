import { STORY_DURATION, STORY_BEATS } from '../../content/story/octocatAbduction';

interface StorySound {
  update(time: number): void;
  setPlaying(playing: boolean): void;
  dispose(): void;
}

const ramp = (time: number, start: number, end: number) => Math.max(0, Math.min(1, (time - start) / (end - start)));
const pulse = (time: number, center: number, width: number) => Math.exp(-Math.pow((time - center) / width, 2));

/** Fixed synthesis voices, mixed against story time; no audio files or scheduled scene events. */
export function createStorySound(onUnavailable: () => void): StorySound | null {
  const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  let context: AudioContext;
  try { context = new AudioContextClass(); } catch { return null; }
  let disposed = false;
  let playing = true;
  let generation = 0;
  const master = context.createGain();
  master.gain.value = .5;
  master.connect(context.destination);
  const definitions: readonly [OscillatorType, number][] = [
    ['sine', 130.81], ['sine', 196], ['triangle', 261.63],
    ['sine', 65.41], ['sine', 69.3], ['sine', 523.25],
  ];
  const voices = definitions.map(([type, frequency]) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type; oscillator.frequency.value = frequency;
    gain.gain.value = 0;
    oscillator.connect(gain); gain.connect(master); oscillator.start();
    return { oscillator, gain };
  });
  // Deterministic filtered noise supplies soft mechanical ticks and the clamp transient.
  const noiseBuffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
  const samples = noiseBuffer.getChannelData(0);
  let seed = 7919;
  for (let i = 0; i < samples.length; i++) { seed = (seed * 16807) % 2147483647; samples[i] = (seed / 2147483647 * 2 - 1) * .4; }
  const noise = context.createBufferSource(); noise.buffer = noiseBuffer; noise.loop = true;
  const filter = context.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 1500; filter.Q.value = .7;
  const foley = context.createGain(); foley.gain.value = 0;
  noise.connect(filter).connect(foley).connect(master); noise.start();
  const resume = () => {
    const token = ++generation;
    void context.resume().then(() => {
      if (disposed || token !== generation) return;
      if (!playing) void context.suspend().catch(() => undefined);
      else if (context.state !== 'running') onUnavailable();
    }).catch(() => { if (!disposed && token === generation) onUnavailable(); });
  };
  // Invoked synchronously from the sound button to retain the browser's user activation.
  resume();
  return {
    update(time) {
      if (disposed) return;
      const fade = ramp(time, 0, 1.4) * (1 - ramp(time, STORY_DURATION - 1.5, STORY_DURATION));
      const tension = ramp(time, 10, 18) * (1 - ramp(time, 34, 36));
      const capture = pulse(time, STORY_BEATS.lock, .2);
      const notice = pulse(time, STORY_BEATS.notice + .35, .22);
      const escape = time >= 30 && time < 35 ? Math.pow(Math.max(0, Math.sin((time - 30) * Math.PI * 6)), 8) : 0;
      const warmth = 1 - tension * .8;
      const beat = time % 1.25;
      const pluck = Math.exp(-beat * 5) * warmth;
      const melody = [523.25, 659.25, 783.99, 659.25, 587.33, 659.25, 523.25, 392];
      const gains = [.027 * warmth, .018 * warmth, .024 * pluck,
        .024 * tension, .014 * tension, .055 * capture + .025 * notice + .014 * escape];
      voices.forEach((voice, index) => voice.gain.gain.setTargetAtTime(gains[index]! * fade, context.currentTime, .035));
      voices[2]!.oscillator.frequency.setTargetAtTime(melody[Math.floor(time / 1.25) % melody.length]!, context.currentTime, .025);
      voices[4]!.oscillator.frequency.setTargetAtTime(69.3 + tension * 4.1, context.currentTime, .04);
      voices[5]!.oscillator.frequency.setTargetAtTime(220 + notice * 660 - capture * 100, context.currentTime, .035);
      const creep = time >= 10 && time < 21 ? Math.pow(Math.max(0, Math.sin(time * Math.PI * 3)), 12) * .007 : 0;
      foley.gain.setTargetAtTime((.14 * capture + .015 * escape + creep) * fade, context.currentTime, .025);
    },
    setPlaying(value) {
      if (disposed || playing === value) return;
      playing = value;
      if (value) resume();
      else { generation++; void context.suspend().catch(() => undefined); }
    },
    dispose() {
      if (disposed) return;
      disposed = true; generation++;
      for (const voice of voices) { voice.oscillator.stop(); voice.oscillator.disconnect(); voice.gain.disconnect(); }
      noise.stop(); noise.disconnect(); filter.disconnect(); foley.disconnect();
      master.disconnect();
      void context.close().catch(() => undefined);
    },
  };
}

export type { StorySound };
