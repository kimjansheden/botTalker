import React from "react";
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonIcon,
  IonContent,
  IonList,
  IonMenuButton,
} from "@ionic/react";
import { menu as menuIcon } from "ionicons/icons";
import { MenuItems, MenuTitle } from "../config/MenuContent";

const HamburgerMenu: React.FC = () => {
  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton color={"primary"}>
              <IonIcon slot="icon-only" icon={menuIcon} />
            </IonMenuButton>
          </IonButtons>
          <MenuTitle />
        </IonToolbar>
      </IonHeader>
      <IonMenu side="start" menuId="first" contentId="main">
        <IonContent>
          <IonList>
            <MenuItems />
          </IonList>
        </IonContent>
      </IonMenu>
    </>
  );
};

export default HamburgerMenu;
