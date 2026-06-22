import { ChakraProvider } from "@chakra-ui/react";
import MainLayout from "./layouts/MainLayout.jsx";
import { MainRouter } from "./router";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./hooks/auth/useAuth.jsx";
import { ChatProvider } from "./context/ChatContext.jsx";
import theme from "./theme";

const App = () => {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <ChatProvider>
          <Router>
            <MainLayout>
              <MainRouter />
            </MainLayout>
          </Router>
        </ChatProvider>
      </AuthProvider>
    </ChakraProvider>
  );
};

export default App;
