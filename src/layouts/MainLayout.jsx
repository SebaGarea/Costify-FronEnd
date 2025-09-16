import { Box } from "@chakra-ui/react";
// import {NavBar} from "../components/NavBar";
import {SidebarWithHeader} from "../components/SideBar";
const MainLayout = ({ children }) => {
  return (
    <Box>
      {/* <NavBar /> */}
      <SidebarWithHeader >
      {children}
      </SidebarWithHeader>
    </Box>
  );
};

export default MainLayout;
