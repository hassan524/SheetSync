"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextType {
  isAuthDialogOpen: boolean;
  setIsAuthDialogOpen: (open: boolean) => void; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);

  console.log("AuthProvider rendered", { isAuthDialogOpen }); 

  return (
    <AuthContext.Provider
      value={{ isAuthDialogOpen, setIsAuthDialogOpen }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  console.log("useAuth called, context:", context); // Add this
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};