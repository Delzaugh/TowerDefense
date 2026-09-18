import type { EncounterContent } from '../../content/schemas/encounter';
import type { Point } from '../../content/schemas/scenario';
import { containsPoint, circleIntersectsRectangle, MARKER_RADIUS } from '../geometry';

// A free diagnostic sight marker, not a tower and not a target.
export function markerRejection(content: EncounterContent, point: Point): 'outside_buildable' | 'blocked' | null {
  if (!containsPoint(content.map.buildable, point, MARKER_RADIUS)) return 'outside_buildable';
  return content.map.obstacles.some(item => circleIntersectsRectangle(point, MARKER_RADIUS, item.footprint)) ? 'blocked' : null;
}
