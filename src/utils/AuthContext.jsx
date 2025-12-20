import { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../api/authApi";

const AuthContext = createContext();

// eslint-disable-next-line react/prop-types
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const handleGetCurrent = (callback) => {
        try {
            const currentUser = authApi.getCurrentUser();
            setUser(currentUser);
            if (callback) callback(currentUser);
            return currentUser;
        } catch (error) {
            console.error("Error getting current user:", error);
            setUser(null);
            if (callback) callback(null);
            return null;
        }
    };

    useEffect(() => {
        // Load user on mount
        const currentUser = handleGetCurrent();
        setLoading(false);

        // Listen for storage changes (e.g., login/logout from other tabs)
        const handleStorageChange = (e) => {
            if (e.key === 'authToken' || e.key === 'currentUser') {
                handleGetCurrent();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const value = {
        user,
        loading,
        handleGetCurrent
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export default AuthContext;
