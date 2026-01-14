import { Box, useColorModeValue } from "@chakra-ui/react";
import { useLocation } from "react-router-dom";
import { SidebarWithHeader } from "../components/SideBar";

const MainLayout = ({ children }) => {
  const location = useLocation();
  const isLoginRoute = location.pathname === "/login";
  const loginBg = useColorModeValue(
    "linear-gradient(140deg, #0b1c28 0%, #050b13 40%, #03102c 110%)",
    "linear-gradient(140deg, #0f172a 0%, #09090a 40%, #0b1120 100%)"
  );
  const glassTint = useColorModeValue("rgba(19, 35, 71, 0.28)", "rgba(12, 24, 62, 0.55)");

  if (isLoginRoute) {
    return (
      <Box position="relative" minH="100vh" overflow="hidden" bg={loginBg}>
        <Box
          position="absolute"
          inset="-25%"
          bg="radial-gradient(circle at 15% 20%, rgba(59,130,246,0.65), transparent 60%)"
          filter="blur(140px)"
          opacity={0.95}
        />
        <Box
          position="absolute"
          inset="-25%"
          bg="radial-gradient(circle at 85% 10%, rgba(14,165,233,0.55), transparent 55%)"
          filter="blur(160px)"
          opacity={0.9}
        />
        <Box
          position="absolute"
          inset="-30%"
          bg="radial-gradient(circle at 50% 90%, rgba(37,99,235,0.45), transparent 60%)"
          filter="blur(150px)"
          opacity={0.7}
        />
        <Box
          position="absolute"
          inset={0}
          bg={glassTint}
          backdropFilter="blur(22px)"
        />
        <Box
          position="relative"
          zIndex={1}
          minH="100vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
          px={{ base: 4, md: 8 }}
        >
          {children}
        </Box>
      </Box>
    );
  }

  return (
    <SidebarWithHeader>
      {children}
    </SidebarWithHeader>
  );
};

export default MainLayout;
