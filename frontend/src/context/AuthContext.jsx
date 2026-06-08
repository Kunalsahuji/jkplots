import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/utils/api';

/**
 * AuthContext — single source of truth for authentication state.
 *
 * Shape:
 *   user:            { id, name, phone, role, savedProperties } | null
 *   isLoading:       true while GET /me is in-flight on app load
 *   isAuthenticated: derived from user !== null
 *   login(user):     called after successful OTP verification
 *   logout():        calls backend, clears context
 *   refreshUser():   re-fetches /me (e.g., after profile update)
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Start true — checking session on mount

    // ─── On app load: check if a valid session (cookie) exists ───────────────
    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data } = await api.get('/users/me');
                if (data.success) {
                    setUser(data.data);
                }
            } catch {
                // 401 or network error — user is not logged in, that's fine
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkSession();
    }, []);

    // ─── Called after successful OTP verification ─────────────────────────────
    const login = useCallback((userData) => {
        setUser(userData);
    }, []);

    // ─── Logout: clear cookie on backend, clear context ──────────────────────
    const logout = useCallback(async () => {
        try {
            await api.post('/users/logout');
        } catch {
            // If logout request fails, still clear local state
        } finally {
            setUser(null);
        }
    }, []);

    // ─── Re-fetch user (e.g., after profile or saved-property update) ─────────
    const refreshUser = useCallback(async () => {
        try {
            const { data } = await api.get('/users/me');
            if (data.success) setUser(data.data);
        } catch {
            setUser(null);
        }
    }, []);

    const value = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth — consume auth context in any component.
 * Throws if used outside AuthProvider (fail-fast in development).
 */
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}
