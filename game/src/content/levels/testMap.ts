import { blockerSlice } from './headlessSlice';
import { parseEncounter } from '../schemas/encounter';

// One authored map for every diagnostic, with only starting Product health varied.
const base = blockerSlice.towerDefinitions[0]!;
// Diagnostic ability/upgrade values, not a playable Persona tree or final balance.
export const testMap = parseEncounter({ ...blockerSlice, id: 'unified_test_map', version: 'v06', initialCompute: 300, towerLimit: 10,
  towerDefinitions: [
    { ...base, allowStatTuning: true, coverageAlternatives: [{ kind: 'cone', angleDegrees: 90 }] },
    { ...base, id: 'tester_probe', label: 'Tester · QA probe', allowStatTuning: true, coverageAlternatives: [{ kind: 'cone', angleDegrees: 90 }],
      baseStats: { ...base.baseStats, workPerAction: 3, damagePerAction: 3 },
      abilities: [{ kind: 'qa_aura', slowPercent: 10, computeBonus: 2, combination: { slow: 'strongest', compute: 'strongest' } }],
      upgrades: [{ id: 'qa_enhancement', label: 'QA enhancement (test)', cost: 20, operations: [{ kind: 'modify', modifiers: [
        { stat: 'qaSlowPercent', operation: 'add', value: 5 }, { stat: 'qaComputeBonus', operation: 'add', value: 1 },
      ] }] }],
      externalEffects: [{ id: 'qa_boost', label: 'QA boost (+5%, 5s)', durationTicks: 300, modifiers: [{ stat: 'qaSlowPercent', operation: 'add', value: 5 }] }],
    },
    { id: 'support_probe', label: 'Support-only QA probe', family: 'copilot', kind: 'passive', canRotate: false,
      coverage: { kind: 'area' }, baseStats: { cost: 30, footprintRadius: .4, range: 5 }, allowStatTuning: true,
      abilities: [{ kind: 'qa_aura', slowPercent: 10, computeBonus: 2, combination: { slow: 'strongest', compute: 'strongest' } }],
      upgrades: [], externalEffects: [],
    },
  ],
});
export const fragileTestMap = parseEncounter({ ...testMap, id: 'unified_test_map_fragile', product: { maximumHealth: 20, initialHealth: 20 } });
