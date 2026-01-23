import { createContext, useContext, useState, useEffect } from "react";
import { login as loginRequest, getCurrentUser } from "../../services/auth.service";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

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

    const loadUser = async () => {
      const storedUser = localStorage.getItem("costify-user");
      const storedToken = localStorage.getItem("costify-token");
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get("token");

      if (urlToken) {
        if (tokenIsValid(urlToken)) {
          localStorage.setItem("costify-token", urlToken);
          localStorage.removeItem("costify-user");
          try {
            const { data } = await getCurrentUser();
            if (!mounted) return;
            const userData = data?.usuario ?? data?.user ?? null;
            if (userData) {
              localStorage.setItem("costify-user", JSON.stringify(userData));
              setUser(userData);
            } else {
              setUser(null);
            }
          } catch (error) {
            console.error("Error obteniendo usuario actual", error);
            localStorage.removeItem("costify-token");
            localStorage.removeItem("costify-user");
            setUser(null);
          }
        } else {
          localStorage.removeItem("costify-token");
          localStorage.removeItem("costify-user");
          setUser(null);
        }

        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
        setInitializing(false);
        return;
      }

      if (storedToken && tokenIsValid(storedToken)) {
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (error) {
            console.error("Error leyendo usuario almacenado", error);
            localStorage.removeItem("costify-user");
            localStorage.removeItem("costify-token");
            setUser(null);
          }
        } else {
          try {
            const { data } = await getCurrentUser();
            if (!mounted) return;
            const userData = data?.usuario ?? data?.user ?? null;
            if (userData) {
              localStorage.setItem("costify-user", JSON.stringify(userData));
              setUser(userData);
            } else {
              setUser(null);
            }
          } catch (error) {
            console.error("Error obteniendo usuario actual", error);
            localStorage.removeItem("costify-token");
            localStorage.removeItem("costify-user");
            setUser(null);
          }
        }
      } else {
        localStorage.removeItem("costify-token");
        localStorage.removeItem("costify-user");
        setUser(null);
      }

      setInitializing(false);
    };

    loadUser();
    return () => {
      mounted = false;
    };
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