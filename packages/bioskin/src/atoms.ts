'use client';

/**
 * @aibos/bioskin/atoms - Lightweight primitive components
 *
 * Use this for minimal bundle size when you only need basic UI primitives.
 * Does NOT include motion/animation dependencies.
 *
 * @example
 * import { Btn, Surface, Txt, Field, cn } from '@aibos/bioskin/atoms';
 *
 * @see PERFORMANCE.md for optimization guide
 */

export { Surface, type SurfaceProps } from './atoms/Surface';
export { Txt, type TxtProps } from './atoms/Txt';
export { Btn, type BtnProps } from './atoms/Btn';
export { Field, type FieldProps, type FieldDefinition } from './atoms/Field';
export { Icon, type IconProps } from './atoms/Icon';
export { cn } from './atoms/utils';
