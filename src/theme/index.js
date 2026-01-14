import { extendTheme } from "@chakra-ui/react";

const deepBlueGradient = "linear-gradient(140deg, #0f172a 0%, #1d4ed8 40%, #0b1120 100%)";

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: "#0b1120",
        color: "gray.50",
        backgroundImage: deepBlueGradient,
        backgroundAttachment: "fixed",
        minHeight: "100vh",
        margin: 0,
      },
      "#root": {
        minHeight: "100vh",
        background: "transparent",
      },
    },
  },
});

export default theme;
