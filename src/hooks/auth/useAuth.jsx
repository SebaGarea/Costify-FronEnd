import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { login as loginRequest, getCurrentUser, canjearCodigoGoogle } from "../../services/auth.service";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const persistUser = useCallback((userData) => {
    if (userData) {
      localStorage.setItem("costify-user", JSON.stringify(userData));
    } else {
      localStorage.removeItem("costify-user");
    }
    setUser(userData);
  }, []);

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
        return false;
      }
    };

    const loadUser = async () => {
      const storedUser = localStorage.getItem("costify-user");
      const storedToken = localStorage.getItem("costify-token");

      if (storedToken && tokenIsValid(storedToken)) {
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (mounted) persistUser(parsedUser);
          } catch (error) {
            localStorage.removeItem("costify-user");
            localStorage.removeItem("costify-token");
            if (mounted) persistUser(null);
          }
        } else {
          try {
            const { data } = await getCurrentUser();
            if (!mounted) return;
            const userData = data?.usuario ?? data?.user ?? null;
            if (userData) {
              persistUser(userData);
            } else {
              persistUser(null);
            }
          } catch (error) {
            localStorage.removeItem("costify-token");
            localStorage.removeItem("costify-user");
            if (mounted) persistUser(null);
          }
        }
      } else {
        localStorage.removeItem("costify-token");
        localStorage.removeItem("costify-user");
        if (mounted) persistUser(null);
      }

      setInitializing(false);
    };

    loadUser();
    return () => {
      mounted = false;
    };
  }, [persistUser]);

  const signIn = async (credentials) => {
    const { data } = await loginRequest(credentials);
    const userData = data.user ?? data.usuario ?? null;
    localStorage.setItem("costify-token", data.token);
    if (userData) {
      persistUser(userData);
      return;
    }

    persistUser(null);
  };

  // Login con Google: el backend redirige con un código de un solo uso que se
  // canjea por el token de sesión.
  const signInWithGoogleCode = async (codigo) => {
    const { data } = await canjearCodigoGoogle(codigo);
    localStorage.setItem("costify-token", data.token);
    persistUser(data.usuario ?? null);
  };

  // Al cambiar la contraseña el backend entrega un token nuevo (los viejos dejan de valer).
  const replaceToken = (token) => {
    if (token) localStorage.setItem("costify-token", token);
  };

  const signOut = () => {
    localStorage.removeItem("costify-token");
    persistUser(null);
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      persistUser(null);
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [persistUser]);

  return (
    <AuthContext.Provider value={{ user, initializing, signIn, signInWithGoogleCode, replaceToken, signOut, setUserData: persistUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}