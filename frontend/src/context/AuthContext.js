import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

function decodePayload(token) {
  try {
    return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = decodePayload(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 < Date.now();
}

function clearStorage() {
  localStorage.removeItem("token");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userRole");
}

function loadToken() {
  const t = localStorage.getItem("token");
  if (!t || isTokenExpired(t)) { clearStorage(); return null; }
  return t;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => loadToken());
  const [user,  setUser]  = useState(() => token ? localStorage.getItem("userEmail") : null);
  const [role,  setRole]  = useState(() => {
    const t = loadToken();
    return t ? (decodePayload(t)?.role || "user") : "user";
  });

  const login = (tok, email) => {
    const r = decodePayload(tok)?.role || "user";
    localStorage.setItem("token",     tok);
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userRole",  r);
    setToken(tok);
    setUser(email);
    setRole(r);
  };

  const logout = () => {
    clearStorage();
    setToken(null);
    setUser(null);
    setRole("user");
  };

  return (
    <AuthContext.Provider value={{
      token, user, role,
      isAuth:  !!token,
      isAdmin: role === "admin",
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
