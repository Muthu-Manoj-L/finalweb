// Lightweight shim that tries to require 'react-native-reanimated' at runtime.
// If not available or if running in Expo Go where native worklets mismatch,
// exports safe no-op fallbacks for the most common APIs used in the app.

type AnyModule = any;

function tryRequire(name: string): AnyModule | null {
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    return require(name);
  } catch (e) {
    return null;
  }
}

const reanimated = tryRequire('react-native-reanimated');

if (reanimated) {
  // Re-export everything from the real module (ES module interop)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = reanimated;
  exports.default = mod.default || mod;
  Object.keys(mod).forEach((k) => {
    if (k !== 'default') exports[k] = mod[k];
  });
} else {
  // Minimal no-op replacements for APIs the app uses (Animated + FadeIn/FadeOut)
  const noop = () => null;

  const shimDefault = {
    // Animated component replacement (fall back to plain react-native View/Text)
    View: require('react-native').View,
    Text: require('react-native').Text,
  };

  exports.default = shimDefault;
  exports.FadeIn = noop;
  exports.FadeOut = noop;
  exports.useSharedValue = () => ({ value: 0 });
  exports.withTiming = (v: any) => v;
}
