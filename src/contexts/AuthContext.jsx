import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { onAuthChange, auth } from "../services/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Forza il refresh dell'utente (es. dopo modifica displayName)
  const refreshUser = useCallback(() => {
    if (auth.currentUser) {
      auth.currentUser.reload().then(() => {
        setUser({ ...auth.currentUser });
      });
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated: !!user, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
