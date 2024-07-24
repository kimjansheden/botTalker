import {
  mailOutline,
  mailSharp,
  paperPlaneOutline,
  paperPlaneSharp,
  homeOutline,
  homeSharp,
  fileTrayStackedOutline,
  fileTrayStackedSharp,
  logInOutline,
  logInSharp,
  settingsOutline,
  settingsSharp,
  personOutline,
  personSharp,
} from "ionicons/icons";
import { AppPage } from "../../common/types";
import {
  IonIcon,
  IonItem,
  IonLabel,
  IonListHeader,
  IonMenuToggle,
  IonTitle,
} from "@ionic/react";
import { PiRobot } from "react-icons/pi";
import { MenuType, currentMenuType } from "./MenuConfig";
import "../themes/css/MenuContent.css";
import { useAuth } from "../provider/AuthProvider";
import { useLocation } from "react-router-dom";

export const MenuItems: React.FC = () => {
  const { user, role } = useAuth();
  const location = useLocation();
  console.log("location.pathname:", location.pathname);
  const appPages: AppPage[] = user
    ? [
        {
          title: "Home",
          url: "/start",
          iosIcon: homeOutline,
          mdIcon: homeSharp,
        },
        {
          title: "Answers to the Bot",
          url: "/readposts",
          iosIcon: mailOutline,
          mdIcon: mailSharp,
        },
        {
          title: "Post History",
          url: "/posthistory",
          iosIcon: fileTrayStackedOutline,
          mdIcon: fileTrayStackedSharp,
        },
        {
          title: "Bot Settings",
          url: "/settings",
          iosIcon: settingsOutline,
          mdIcon: settingsSharp,
          // otherIcon: <PiRobot />,
        },
        {
          title: "User Settings",
          url: "/usersettings",
          iosIcon: personOutline,
          mdIcon: personSharp,
        },
      ]
    : [];

  // Add admin pages if the user is an admin
  console.log("role:", role);
  if (role === "admin") {
    appPages.push(
      {
        title: "(Admin) Delete Posts",
        url: "/deleteposts",
        iosIcon: paperPlaneOutline,
        mdIcon: paperPlaneSharp,
      },
      {
        title: "(Admin) Add Posts",
        url: "/addposts",
        iosIcon: paperPlaneOutline,
        mdIcon: paperPlaneSharp,
      },
      {
        title: "(Admin) Firebase",
        url: "/firebase",
        iosIcon: settingsOutline,
        mdIcon: settingsSharp,
      }
    );
  }

  // Add login/logout based on user status
  appPages.push({
    title: !user ? "Login | Sign Up" : "Logout",
    url: !user ? "/login" : "/logout",
    iosIcon: logInOutline,
    mdIcon: logInSharp,
  });

  return (
    <>
      {user && <div>Logged in as {user.email}</div>}
      {appPages.map((appPage, index) => (
        <IonMenuToggle key={index} autoHide={false}>
          <IonItem
            className={`${
              location.pathname === appPage.url ? "selected" : ""
            } ${appPage.otherIcon ? "has-other-icon" : ""}`}
            routerLink={appPage.url}
            routerDirection="none"
            lines="none"
            detail={false}
          >
            {appPage.otherIcon ? (
              appPage.otherIcon
            ) : (
              <IonIcon
                aria-hidden="true"
                slot="start"
                ios={appPage.iosIcon}
                md={appPage.mdIcon}
              />
            )}
            <IonLabel>{appPage.title}</IonLabel>
          </IonItem>
        </IonMenuToggle>
      ))}
    </>
  );
};

export const MenuTitle: React.FC = () => {
  const Component =
    currentMenuType === MenuType.SidebarMenu ? IonListHeader : IonTitle;
  console.log("currentMenuType:", currentMenuType);
  return (
    <Component className={`${currentMenuType}`}>
      FlashbackBot Dashboard
    </Component>
  );
};
