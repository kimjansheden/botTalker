import {
  IonApp,
  IonRouterOutlet,
  IonSplitPane,
  setupIonicReact,
} from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/* Theme variables */
import "./themes/css/variables.css";

/* Custom CSS rules */
import "./themes/css/main.css";
import "./themes/css/toasts.css";
import "./themes/css/placeholders.css";
import "./themes/css/inputLabels.css";
import "./themes/css/common.css";

import { useMenuContext } from "./context/MenuContext";
import HamburgerMenu from "./components/HamburgerMenu";
import SidebarMenu from "./components/SidebarMenu";
import AppRoutes from "./AppRoutes";
import { MenuType } from "./config/MenuConfig";
import AppProviders from "./provider/AppProviders";

setupIonicReact();

const publicPath = "/flashbackbot/";

const App: React.FC = () => {
  return (
    <IonApp>
      <AppProviders>
        <IonReactRouter basename={publicPath}>
          <MenuComponentWrapper />
        </IonReactRouter>
      </AppProviders>
    </IonApp>
  );
};

const MenuComponentWrapper: React.FC = () => {
  const { menuType } = useMenuContext();

  if (menuType === MenuType.SidebarMenu) {
    return (
      <IonSplitPane contentId="main">
        <SidebarMenu />
        <IonRouterOutlet id="main">
          <AppRoutes />
        </IonRouterOutlet>
      </IonSplitPane>
    );
  } else {
    return (
      <>
        <HamburgerMenu />
        <IonRouterOutlet id="main">
          <AppRoutes />
        </IonRouterOutlet>
      </>
    );
  }
};

export default App;
