import type { RuntimeAsset } from '../runtimeAsset';
import copilot from 'tower-asset:copilot_base@v02';
import octocat from 'tower-asset:copilot_octocat_classic_lowpoly@v01';
import bug from 'tower-asset:problem_bug@v01';
import courtyard from 'tower-asset:story_courtyard@v01';
import carrier from 'tower-asset:story_capture_carrier@v01';

/** Bind roles here; scene direction never depends on concrete mesh or bone names. */
export const STORY_ASSETS: Readonly<Record<string, RuntimeAsset>> = { copilot, octocat, bug, courtyard, carrier };
