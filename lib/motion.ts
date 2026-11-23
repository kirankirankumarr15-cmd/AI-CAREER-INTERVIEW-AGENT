// ============================================================================
// PRISM Motion Design System — Unified Animation Presets & Easings
// Human-Computer Interaction & Motion Architecture
// ============================================================================

import type { Variants, Transition } from 'framer-motion';

/**
 * Standard cubic-bezier easing curves
 * Designed for organic, natural feedback without jarring motion
 */
export const EASINGS = {
  // Apple / Modern SaaS default curve: snappy start, gentle deceleration
  standard: [0.22, 1, 0.36, 1] as const,
  // Smooth deceleration for entering elements
  decelerate: [0.0, 0.0, 0.2, 1] as const,
  // Smooth acceleration for exiting elements
  accelerate: [0.4, 0.0, 1, 1] as const,
  // Emphasis curve for highlighted badges, notifications, modals
  emphasized: [0.16, 1, 0.3, 1] as const,
};

/**
 * Spring configurations for tactile physical feedback (buttons, cards, toggles)
 */
export const SPRINGS = {
  snappy: { type: 'spring', stiffness: 400, damping: 30 } as Transition,
  gentle: { type: 'spring', stiffness: 260, damping: 24 } as Transition,
  bouncy: { type: 'spring', stiffness: 500, damping: 22 } as Transition,
  card:   { type: 'spring', stiffness: 350, damping: 28 } as Transition,
};

/**
 * Standard Page Transition Variants
 * Smooth 8px vertical lift + opacity fade in 300ms
 */
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: EASINGS.standard,
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: {
      duration: 0.2,
      ease: EASINGS.accelerate,
    },
  },
};

/**
 * Container with staggered child reveals
 */
export const staggerContainer = (staggerChildren = 0.06, delayChildren = 0): Variants => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

/**
 * Fade In Up variant for staggered cards / dashboard items
 */
export const fadeInUp: Variants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: EASINGS.standard,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
      ease: EASINGS.accelerate,
    },
  },
};

/**
 * Modal & Dialog Transition Variants
 */
export const modalOverlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2, ease: EASINGS.decelerate } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: EASINGS.accelerate } },
};

export const modalContentVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.96,
    y: 12,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: EASINGS.emphasized,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 8,
    transition: {
      duration: 0.15,
      ease: EASINGS.accelerate,
    },
  },
};

/**
 * Dropdown & Tooltip Popover Variants
 */
export const dropdownVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: -4,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.18,
      ease: EASINGS.standard,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -4,
    transition: {
      duration: 0.12,
      ease: EASINGS.accelerate,
    },
  },
};

/**
 * Accordion / Expandable height animation
 */
export const accordionVariants: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.28, ease: EASINGS.standard },
      opacity: { duration: 0.22, delay: 0.05 },
    },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.22, ease: EASINGS.accelerate },
      opacity: { duration: 0.15 },
    },
  },
};

/**
 * Button Tap & Hover Interactions
 */
export const buttonMotion = {
  hover: { scale: 1.015, transition: { duration: 0.15, ease: EASINGS.standard } },
  tap: { scale: 0.975, transition: { duration: 0.08 } },
};

/**
 * Subtle Card Hover Interaction
 */
export const cardHoverMotion = {
  hover: {
    y: -2,
    transition: { duration: 0.2, ease: EASINGS.standard },
  },
  tap: {
    scale: 0.995,
    transition: { duration: 0.1 },
  },
};
