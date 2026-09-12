import React from "react";

/**
 * framer-motion for tests: plain elements that drop the animation props.
 * The real library pulls in its own copy of React under vitest and breaks
 * hooks; nothing here needs the motion anyway, only the markup.
 */
const MOTION_PROPS = new Set([
  "initial",
  "animate",
  "exit",
  "transition",
  "variants",
  "whileHover",
  "whileTap",
  "whileFocus",
  "layout",
  "layoutId",
]);

function plain(tag: string) {
  const Plain = React.forwardRef<HTMLElement, Record<string, unknown>>(function Plain(props, ref) {
    const rest: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(props)) {
      if (!MOTION_PROPS.has(key)) rest[key] = value;
    }
    return React.createElement(tag, { ...rest, ref });
  });
  Plain.displayName = `motion.${tag}`;
  return Plain;
}

const cache = new Map<string, ReturnType<typeof plain>>();

export const motion = new Proxy({} as Record<string, ReturnType<typeof plain>>, {
  get(_target, tag: string) {
    let component = cache.get(tag);
    if (!component) {
      component = plain(tag);
      cache.set(tag, component);
    }
    return component;
  },
});

export function AnimatePresence({ children }: { children?: React.ReactNode }) {
  return React.createElement(React.Fragment, null, children);
}

export function useReducedMotion() {
  return false;
}
