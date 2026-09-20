import { createContext, useState, useEffect, useCallback, useContext } from "react";
import authService from "../services/authService";
import { tokenStorage } from "../core/utils/tokenStorage";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(() => tokenStorage.getUser());
    const [token, setToken] = useState(() => tokenStorage.getToken());
    const [loading, setLoading] = useState(true);

    // Refresh user session on mount if token exists
    useEffect(() => {
        const initAuth = async () => {
            const storedToken = tokenStorage.getToken();
            if (storedToken) {
                try {
                    const user = await authService.getCurrentUser();
                    setCurrentUser(user);
                    setToken(storedToken);
                } catch (err) {
                    console.error("Auth session expired or invalid:", err);
                    tokenStorage.clear();
                    setCurrentUser(null);
                    setToken(null);
                }
            } else {
                setCurrentUser(null);
                setToken(null);
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = useCallback(async ({ email, password }) => {
        const result = await authService.login({ email, password });
        setCurrentUser(result.user);
        setToken(result.token);
        return result;
    }, []);

    const signup = useCallback(async ({ username, email, password, name }) => {
        const result = await authService.signup({ username, email, password, name });
        setCurrentUser(result.user);
        setToken(result.token);
        return result;
    }, []);

    const logout = useCallback(() => {
        authService.logout();
        setCurrentUser(null);
        setToken(null);
    }, []);

    const refreshUser = useCallback(async () => {
        try {
            const user = await authService.getCurrentUser();
            setCurrentUser(user);
            return user;
        } catch {
            return null;
        }
    }, []);

    const value = {
        currentUser,
        setCurrentUser,
        token,
        isAuthenticated: !!token && !!currentUser,
        loading,
        login,
        signup,
        logout,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export default AuthContext;
