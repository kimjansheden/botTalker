import React from "react";
import { PushesProvider } from "../provider/PushesProvider";
import { MenuProvider } from "../context/MenuContext";
import { AuthProvider } from "../provider/AuthProvider";

const AppProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <PushesProvider>
      <AuthProvider>
        <MenuProvider>{children}</MenuProvider>
      </AuthProvider>
    </PushesProvider>
  );
};

export default AppProviders;
