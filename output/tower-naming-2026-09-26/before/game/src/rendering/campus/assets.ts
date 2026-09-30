import type { CampusAssetId } from '../../content/maps/campusHome';
import type { RuntimeAsset } from '../runtimeAsset';
import baseHex from 'tower-asset:campus_base_hex@v01';
import bushRound from 'tower-asset:campus_bush_round@v01';
import cafeTable from 'tower-asset:campus_cafe_table@v01';
import codeSculpture from 'tower-asset:campus_code_sculpture@v01';
import coffeeKiosk from 'tower-asset:campus_coffee_kiosk@v01';
import flowerBed from 'tower-asset:campus_flower_bed@v01';
import hedge from 'tower-asset:campus_hedge@v01';
import lab from 'tower-asset:campus_lab@v01';
import meetingNook from 'tower-asset:campus_meeting_nook@v01';
import noticeboard from 'tower-asset:campus_noticeboard@v01';
import pathBollard from 'tower-asset:campus_path_bollard@v01';
import planterBench from 'tower-asset:campus_planter_bench@v01';
import pond from 'tower-asset:campus_pond@v01';
import solar from 'tower-asset:campus_solar@v01';
import tileHill from 'tower-asset:campus_tile_hill@v01';
import tilePark from 'tower-asset:campus_tile_park@v01';
import tilePlaza from 'tower-asset:campus_tile_plaza@v01';
import tileCivic from 'tower-asset:campus_tile_civic@v01';
import tileCanyon from 'tower-asset:campus_tile_canyon@v01';
import tileConstruction from 'tower-asset:campus_tile_construction@v01';
import tileUtility from 'tower-asset:campus_tile_utility@v01';
import tileForest from 'tower-asset:campus_tile_forest@v01';
import cave from 'tower-asset:campus_cave@v01';
import civicDecor from 'tower-asset:campus_civic_decor@v01';
import canyonDecor from 'tower-asset:campus_canyon_decor@v01';
import constructionDecor from 'tower-asset:campus_construction_decor@v01';
import utilityDecor from 'tower-asset:campus_utility_decor@v01';
import treeCluster from 'tower-asset:campus_tree_cluster@v01';
import treeRound from 'tower-asset:campus_tree_round@v01';
import treeTall from 'tower-asset:campus_tree_tall@v01';
import treePineBare from 'tower-asset:campus_tree_pine_bare@v01';
import treeSpreadingBare from 'tower-asset:campus_tree_spreading_bare@v01';
import treeAutumnBare from 'tower-asset:campus_tree_autumn_bare@v01';
import walkBend from 'tower-asset:campus_walk_bend@v01';
import walkJunction from 'tower-asset:campus_walk_junction@v01';
import walkLanding from 'tower-asset:campus_walk_landing@v01';
import walkStraight from 'tower-asset:campus_walk_straight@v01';
import walkShort from 'tower-asset:campus_walk_short@v01';
import wayfindingSign from 'tower-asset:campus_wayfinding_sign@v01';
import copilot from 'tower-asset:copilot_base@v02';
import developer from 'tower-asset:copilot_developer@v01';
import octocat from 'tower-asset:github_octocat_classic_lowpoly@v01';
import rubberDuck from 'tower-asset:copilot_rubber_duck@v01';

export const CAMPUS_ASSETS: Readonly<Record<CampusAssetId, RuntimeAsset>> = {
  campus_base_hex: baseHex,
  campus_bush_round: bushRound,
  campus_cafe_table: cafeTable,
  campus_code_sculpture: codeSculpture,
  campus_coffee_kiosk: coffeeKiosk,
  campus_flower_bed: flowerBed,
  campus_hedge: hedge,
  campus_lab: lab,
  campus_meeting_nook: meetingNook,
  campus_noticeboard: noticeboard,
  campus_path_bollard: pathBollard,
  campus_planter_bench: planterBench,
  campus_pond: pond,
  campus_solar: solar,
  campus_tile_hill: tileHill,
  campus_tile_park: tilePark,
  campus_tile_plaza: tilePlaza,
  campus_tile_civic: tileCivic,
  campus_tile_canyon: tileCanyon,
  campus_tile_construction: tileConstruction,
  campus_tile_utility: tileUtility,
  campus_tile_forest: tileForest,
  campus_cave: cave,
  campus_civic_decor: civicDecor,
  campus_canyon_decor: canyonDecor,
  campus_construction_decor: constructionDecor,
  campus_utility_decor: utilityDecor,
  campus_tree_cluster: treeCluster,
  campus_tree_round: treeRound,
  campus_tree_tall: treeTall,
  campus_tree_pine_bare: treePineBare,
  campus_tree_spreading_bare: treeSpreadingBare,
  campus_tree_autumn_bare: treeAutumnBare,
  campus_walk_bend: walkBend,
  campus_walk_junction: walkJunction,
  campus_walk_landing: walkLanding,
  campus_walk_straight: walkStraight,
  campus_walk_short: walkShort,
  campus_wayfinding_sign: wayfindingSign,
};

export const COPILOT_ASSET = copilot;
export const RESIDENT_ASSETS = [developer, octocat, rubberDuck] as const;
