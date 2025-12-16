/**
 * @aibos/bioskin - Atoms (Layer 1)
 * 
 * Primitive components per CONT_10 BioSkin Architecture
 * These form the foundation for molecules and organisms.
 */

// Primitives
export { Surface, type SurfaceProps, COMPONENT_META as SURFACE_META } from './Surface';
export { Txt, type TxtProps, COMPONENT_META as TXT_META } from './Txt';
export { Btn, type BtnProps, COMPONENT_META as BTN_META } from './Btn';
export { Field, type FieldProps, type FieldDefinition, COMPONENT_META as FIELD_META } from './Field';
export { Icon, type IconProps, COMPONENT_META as ICON_META } from './Icon';

// Utilities
export { cn } from './utils';
