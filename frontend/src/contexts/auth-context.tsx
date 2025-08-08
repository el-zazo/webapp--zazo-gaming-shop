"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from "react";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface User {
  _id: string;
  username: string;
  email: string;
  avatar_url?: string;
  role?: "user" | "admin";
}

interface Favorite {
  _id: string;
  user_id: string;
  product_id: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  favorites: Favorite[];
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => Promise<void>;
  login: (email: string, password_hash: string, role: "user" | "admin") => Promise<void>;
  register: (username: string, email: string, password_hash: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  favorites: [],
  isFavorite: () => false,
  toggleFavorite: async () => {},
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  const fetchFavorites = useCallback(async (userId: string, userToken: string) => {
    if (!API_BASE_URL) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/favorites?user_id=${userId}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setFavorites(response.data.data || []);
    } catch (error) {
      // console.error('Failed to fetch favorites', error);
      setFavorites([]);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setFavorites([]);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    // We let the cart context handle its own state on logout
  }, []);

  useEffect(() => {
    const loadUserFromStorage = async () => {
      const storedToken = localStorage.getItem("token");
      const storedRole = localStorage.getItem("role") as "user" | "admin" | null;

      if (storedToken && storedRole) {
        setToken(storedToken);
        const meEndpoint = storedRole === "admin" ? "/admins/me" : "/users/me";
        try {
          if (!API_BASE_URL) {
            // console.error("API base URL is not configured. Please set NEXT_PUBLIC_API_BASE_URL environment variable.");
            setLoading(false);
            return;
          }
          const response = await fetch(`${API_BASE_URL}${meEndpoint}`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          if (response.ok) {
            const responseData = await response.json();
            const userData = responseData.data;
            setUser({ ...userData, role: storedRole });
            if (storedRole === "user") {
              await fetchFavorites(userData._id, storedToken);
            }
          } else {
            // console.error('Failed to authenticate with stored token.');
            logout();
          }
        } catch (error) {
          // console.error('Failed to fetch user', error);
          logout();
        }
      }
      setLoading(false);
    };

    loadUserFromStorage();
  }, [fetchFavorites, logout]);

  const login = async (email: string, password_hash: string, role: "user" | "admin") => {
    if (!API_BASE_URL) throw new Error("API base URL is not configured.");
    const loginEndpoint = role === "admin" ? "/admins/login" : "/users/login";

    const response = await fetch(`${API_BASE_URL}${loginEndpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password_hash }),
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Login failed");
      } catch (e) {
        throw new Error("Failed to fetch. The server might be down or returning an invalid response.");
      }
    }

    const responseData = await response.json();
    const { user: loggedInUser, token: newToken } = responseData.data;
    setUser({ ...loggedInUser, role });
    setToken(newToken);
    localStorage.setItem("token", newToken);
    localStorage.setItem("role", role);

    if (role === "user") {
      await fetchFavorites(loggedInUser._id, newToken);
    }
  };

  const register = async (username: string, email: string, password_hash: string) => {
    if (!API_BASE_URL) throw new Error("API base URL is not configured.");
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password_hash }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Registration failed");
    }
  };

  const isFavorite = (productId: string) => {
    return favorites.some((fav) => fav.product_id === productId);
  };

  const toggleFavorite = async (productId: string) => {
    if (!user || !token) throw new Error("User not authenticated");
    if (!API_BASE_URL) throw new Error("API base URL is not configured.");

    const existingFavorite = favorites.find((fav) => fav.product_id === productId);

    if (existingFavorite) {
      // Unfavorite
      await axios.delete(`${API_BASE_URL}/favorites/${existingFavorite._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites((prev) => prev.filter((fav) => fav._id !== existingFavorite._id));
    } else {
      // Favorite
      const response = await axios.post(`${API_BASE_URL}/favorites`, { user_id: user._id, product_id: productId }, { headers: { Authorization: `Bearer ${token}` } });
      setFavorites((prev) => [...prev, response.data.data]);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        favorites,
        isFavorite,
        toggleFavorite,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
