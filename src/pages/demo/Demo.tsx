import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { PartialProps } from "../../../common/types";

const Demo: React.FC<PartialProps> = ({ standalone = false }) => {
  const content = (
    <>
    <IonHeader>
        <IonToolbar>
          <IonTitle>Demo</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding"><p>Start demo</p><p>Demo is not done yet. Feel free to create an account anyway and check out the site!</p></IonContent>
    </>
  );
  if (standalone) {
    return <IonPage>{content}</IonPage>;
  }

  return <>{content}</>;
};

export default Demo;
