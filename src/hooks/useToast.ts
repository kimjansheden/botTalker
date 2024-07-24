import { useIonToast } from "@ionic/react";

const useToast = () => {
  const [presentToast] = useIonToast();

  const presentSuccessToast = (message: string) => {
    presentToast({
      message,
      duration: 5000,
      color: "success",
      position: "middle",
      cssClass: "toast",
    });
  };

  const presentDangerToast = (message: string) => {
    presentToast({
      message,
      duration: 5000,
      color: "danger",
      position: "middle",
      cssClass: "toast",
    });
  };

  return {
    presentSuccessToast,
    presentDangerToast,
  };
};

export default useToast;
