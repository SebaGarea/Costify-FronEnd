import { createContext, useContext, useState, useEffect } from "react";
import { login as loginRequest } from "../../services/auth.service";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("costify-user");
    const storedToken = localStorage.getItem("costify-token");

    const tokenIsValid = (token) => {
      if (!token) return false;
      try {
        const [, payload] = token.split(".");
        if (!payload) return false;
        const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
        if (!decoded?.exp) return false;
        return decoded.exp * 1000 > Date.now();
      } catch (error) {
        console.error("Token inválido", error);
        return false;
      }
    };

    if (storedUser && storedToken && tokenIsValid(storedToken)) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error leyendo usuario almacenado", error);
        localStorage.removeItem("costify-user");
        localStorage.removeItem("costify-token");
      }
    } else {
      localStorage.removeItem("costify-token");
      localStorage.removeItem("costify-user");
      setUser(null);
    }

    setInitializing(false);
  }, []);

  const signIn = async (credentials) => {
    const { data } = await loginRequest(credentials);
    const userData = data.user ?? data.usuario ?? null;
    localStorage.setItem("costify-token", data.token);
    if (userData) {
      localStorage.setItem("costify-user", JSON.stringify(userData));
      setUser(userData);
      return;
    }

    localStorage.removeItem("costify-user");
    setUser(null);
  };

  const signOut = () => {
    localStorage.removeItem("costify-token");
    localStorage.removeItem("costify-user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, initializing, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}