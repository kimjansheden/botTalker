import { IonContent, IonList, IonMenu } from "@ionic/react";

import "../themes/css/SidebarMenu.css";
import { MenuItems, MenuTitle } from "../config/MenuContent";

const Menu: React.FC = () => {
  return (
    <IonMenu contentId="main" type="overlay">
      <IonContent>
        <IonList id="inbox-list">
          <MenuTitle />
          <MenuItems />
        </IonList>
      </IonContent>
    </IonMenu>
  );
};

export default Menu;
