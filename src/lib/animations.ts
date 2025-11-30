/**
 * Animation Variants for Framer Motion
 * Keylio Wallet - Consistent animation system
 *
 * 使用指南：
 * - fadeIn/fadeInUp: 一般元素入場
 * - scaleIn: 彈出框/卡片
 * - stepTransition: 多步驟表單切換
 * - staggerContainer + staggerItem: 列表動畫
 */

// ========================================
// 基礎動畫
// ========================================

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
};

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }
  },
  exit: { opacity: 0, y: 20 }
};

export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: "easeOut" }
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2, ease: "easeOut" }
};

// ========================================
// 步驟切換動畫（用於多步驟表單/Dialog）
// ========================================

export const stepTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.3, ease: "easeOut" }
};

// ========================================
// 滑入動畫
// ========================================

export const slideInRight = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 50 },
  transition: { duration: 0.3, ease: "easeOut" }
};

export const slideInLeft = {
  initial: { opacity: 0, x: -50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
  transition: { duration: 0.3, ease: "easeOut" }
};

// Stagger children animation
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
};

// Modal/Dialog animations
export const modalBackdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
};

export const modalContent = {
  initial: { opacity: 0, scale: 0.9, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, y: 20 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
};

// Button press animation
export const buttonTap = {
  whileTap: { scale: 0.95 },
  transition: { duration: 0.1 }
};

// Card hover animation
export const cardHover = {
  whileHover: { y: -4, transition: { duration: 0.2 } },
  transition: { duration: 0.2 }
};

// Ripple effect config
export const rippleEffect = {
  initial: { scale: 0, opacity: 0.5 },
  animate: { scale: 2, opacity: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};
