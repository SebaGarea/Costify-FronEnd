import { Box } from "@chakra-ui/react";
import {SidebarWithHeader}from "../components/SideBar";
const MainLayout = ({ children }) => {
  return (
    <Box>

      <SidebarWithHeader >
      {children}
      </SidebarWithHeader>
    </Box>
  );
};

export default MainLayout;
