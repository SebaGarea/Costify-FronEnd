import { extendTheme } from "@chakra-ui/react";
import { mode } from "@chakra-ui/theme-tools";

// Inter, loaded once in index.html, is the single family across the app.
const interStack =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const styles = {
  global: (props) => ({
    body: {
      bg: mode("#f5f7fb", "#050b13")(props),
      color: mode("gray.800", "gray.50")(props),
      margin: 0,
      fontFeatureSettings: "'cv01', 'cv03', 'cv04'",
      WebkitFontSmoothing: "antialiased",
    },
    "#root": {
      background: mode("#f5f7fb", "#050b13")(props),
      minHeight: "100vh",
    },
    // Tabular figures wherever money/quantities are compared.
    ".tnum, .chakra-stat__number": {
      fontVariantNumeric: "tabular-nums",
      fontFeatureSettings: "'tnum'",
    },
    // Reduced motion: neutralize transitions/animations for users who ask.
    "@media (prefers-reduced-motion: reduce)": {
      "*, *::before, *::after": {
        animationDuration: "0.01ms !important",
        animationIterationCount: "1 !important",
        transitionDuration: "0.01ms !important",
        scrollBehavior: "auto !important",
      },
    },
  }),
};

const theme = extendTheme({
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
  fonts: {
    heading: interStack,
    body: interStack,
  },
  colors: {
    // Cockpit Teal — the one action/state voice (Chakra teal scale, surfaced as brand).
    brand: {
      50: "#E6FFFA",
      100: "#B2F5EA",
      200: "#81E6D9",
      300: "#4FD1C5",
      400: "#38B2AC",
      500: "#319795",
      600: "#2C7A7B",
      700: "#285E61",
      800: "#234E52",
      900: "#1D4044",
    },
  },
  components: {
    Heading: {
      baseStyle: {
        letterSpacing: "-0.01em",
      },
    },
  },
  styles,
});

export default theme;
