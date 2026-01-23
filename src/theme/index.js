import { extendTheme } from "@chakra-ui/react";
import { mode } from "@chakra-ui/theme-tools";

const styles = {
  global: (props) => ({
    body: {
      bg: mode("#f5f7fb", "#050b13")(props),
      color: mode("gray.800", "gray.50")(props),
      margin: 0,
    },
    "#root": {
      background: mode("#f5f7fb", "#050b13")(props),
      minHeight: "100vh",
    },
  }),
};

const theme = extendTheme({
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
  styles,
});

export default theme;
