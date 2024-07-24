import React, { createContext, useContext, useState, ReactNode } from "react";
import { currentMenuType as initialMenuType, MenuType } from "../config/MenuConfig";

interface MenuContextProps {
  menuType: string;
  toggleMenuType: () => void;
}

const MenuContext = createContext<MenuContextProps | undefined>(undefined);

export const MenuProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [menuType, setMenuType] = useState(initialMenuType);

  const toggleMenuType = () => {
    setMenuType((prevType) =>
      prevType === MenuType.SidebarMenu
        ? MenuType.HamburgerMenu
        : MenuType.SidebarMenu
    );
  };

  return (
    <MenuContext.Provider value={{ menuType, toggleMenuType }}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenuContext = (): MenuContextProps => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error("useMenuContext must be used within a MenuProvider");
  }
  return context;
};
