export const animations = {
  // Snappy spring animations for UI elements
  spring: {
    snappy: {
      type: "spring",
      stiffness: 400,
      damping: 30,
    },
    gentle: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
    bouncy: {
      type: "spring",
      stiffness: 400,
      damping: 15,
    },
  },
  
  // Transition durations
  duration: {
    fast: 0.1,
    normal: 0.2,
    slow: 0.4,
  },
  
  // Easing functions
  ease: {
    snappy: [0.22, 1, 0.36, 1],
    standard: [0.4, 0, 0.2, 1],
  },
} as const
