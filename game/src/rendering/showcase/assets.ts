import type { RuntimeAsset } from '../runtimeAsset';
import base from 'tower-asset:copilot_base@v02';
import developer from 'tower-asset:copilot_developer@v01';
import tester from 'tower-asset:copilot_tester@v01';
import analyst from 'tower-asset:copilot_analyst@v01';
import security from 'tower-asset:copilot_security@v01';
import linter from 'tower-asset:copilot_linter@v01';
import seniorDeveloper from 'tower-asset:copilot_golden_compiler@v01';
import commitHalo from 'tower-asset:copilot_commit_halo@v01';

/** Only delivered, catalog-registered Tower models belong here. */
export const SHOWCASE_TOWERS: Readonly<Record<string, RuntimeAsset>> = {
  base, developer, tester, analyst, security, linter,
  'senior-developer': seniorDeveloper,
  'commit-halo': commitHalo,
};
