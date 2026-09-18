import { z } from 'zod';

export const modeSchema = z.enum(['auto', 'build', 'defend']);
export const prioritySchema = z.enum(['closest_to_product', 'first_spawned']);
export const facingSchema = z.number().finite().min(0).lt(360);
export const coverageKindSchema = z.enum(['area', 'cone']);
