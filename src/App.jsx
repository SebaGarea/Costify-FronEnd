import { ChakraProvider } from "@chakra-ui/react";
import MainLayout from "./layouts/MainLayout.jsx";
import {MainRouter} from "./router";
import { BrowserRouter as Router } from "react-router-dom";
const App = () => {


  return (
    <ChakraProvider>
      <Router>
        <MainLayout>
          <MainRouter />
        </MainLayout>
      </Router>
    </ChakraProvider>
  );
};

export default App;
