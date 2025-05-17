/**
 * TransitionType.ts
 * 
 * This file defines the TransitionType enum for representing different types of transitions.
 */

/**
 * Enum defining different transition types
 */
enum TransitionType {
  CUT = 'cut',
  DISSOLVE = 'dissolve',
  FADE_IN = 'fade_in',
  FADE_OUT = 'fade_out',
  WIPE = 'wipe',
  DIP_TO_BLACK = 'dip_to_black',
  DIP_TO_WHITE = 'dip_to_white',
  CUSTOM = 'custom'
}

export default TransitionType;
