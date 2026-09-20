/**
 * Token and Session Storage Abstraction (Layer 4)
 */

const TOKEN_KEY = "codehub_token";
const USER_KEY = "codehub_user";

export const tokenStorage = {
    getToken() {
        return localStorage.getItem(TOKEN_KEY) || localStorage.getItem("token") || null;
    },

    setToken(token) {
        if (token) {
            localStorage.setItem(TOKEN_KEY, token);
            localStorage.setItem("token", token); // backward compatibility
        }
    },

    removeToken() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem("token");
    },

    getUser() {
        try {
            const raw = localStorage.getItem(USER_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },

    setUser(user) {
        if (user) {
            localStorage.setItem(USER_KEY, JSON.stringify(user));
            if (user._id || user.id) {
                localStorage.setItem("userId", user._id || user.id); // backward compatibility
            }
        }
    },

    removeUser() {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem("userId");
    },

    clear() {
        this.removeToken();
        this.removeUser();
    },
};
