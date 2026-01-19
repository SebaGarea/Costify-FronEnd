import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
  styles: {
    global: {
      body: {
        bg: "#050b13",
        color: "gray.50",
        margin: 0,
      },
      "#root": {
        background: "#050b13",
      },
    },
  },
});

export default theme;
