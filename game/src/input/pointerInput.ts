import type { Point } from '../content/schemas/scenario';

/** Uses the SVG transform, including aspect-ratio letterboxing, not raw pixels. */
export function toLogicalPoint(svg: SVGSVGElement, clientX: number, clientY: number): Point | null {
  const transform = svg.getScreenCTM();
  if (!transform) return null;
  const point = new DOMPoint(clientX, clientY).matrixTransform(transform.inverse());
  return { x: point.x, z: point.y };
}
