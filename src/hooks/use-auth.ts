import { useEffect } from "react";
import { create } from "zustand";
import { db } from "@/lib/db";
import type { User } from "@/types/auth";

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (init: boolean) => void;
}

const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  isInitialized: false,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setInitialized: (isInitialized) => set({ isInitialized }),
}));

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    // Only initialize once across the whole app
    if (store.isInitialized) return;

    const loadUser = async () => {
      try {
        const storedId = localStorage.getItem("flowforge_user_id");
        if (storedId) {
          const user = await db.users.get(storedId);
          if (user) {
            store.setUser(user);
          } else {
            localStorage.removeItem("flowforge_user_id");
          }
        }
      } catch (err) {
        console.error("Failed to load user:", err);
      } finally {
        store.setLoading(false);
        store.setInitialized(true);
      }
    };
    loadUser();
  }, [store.isInitialized]);

  const login = async (email: string, password?: string) => {
    const user = await db.users.where("email").equals(email.toLowerCase()).first();
    if (!user) {
      throw new Error("User not found");
    }
    
    if (user.password && user.password !== password) {
      throw new Error("Invalid password");
    }
    
    // Update last login
    const updatedUser = { ...user, lastLoginAt: new Date().toISOString() };
    await db.users.put(updatedUser);
    
    localStorage.setItem("flowforge_user_id", user.id);
    store.setUser(updatedUser);
    return updatedUser;
  };

  const register = async (name: string, email: string, password?: string) => {
    const existing = await db.users.where("email").equals(email.toLowerCase()).first();
    if (existing) {
      throw new Error("Email already in use");
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email: email.toLowerCase(),
      password,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    await db.users.add(newUser);
    localStorage.setItem("flowforge_user_id", newUser.id);
    store.setUser(newUser);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem("flowforge_user_id");
    store.setUser(null);
  };

  return {
    user: store.user,
    isLoading: store.isLoading,
    login,
    register,
    logout,
  };
}
