import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonSkeletonText,
  IonCard,
  IonCardHeader,
  IonCardTitle,
} from "@ionic/react";
import React, { useEffect, useState } from "react";
import { togglePost } from "../components/Helpers";
import "../themes/css/ReadPosts.css";
import RawPushesDisplay from "../components/RawPushesDisplay";
import { usePushesContext } from "../hooks/usePushesContext";
import useFetchPushes from "../hooks/useFetchPushes";
import ParsedDataCard from "../components/ui/ParsedDataCard";
import { useAuth } from "../provider/AuthProvider";

const ReadPosts: React.FC = () => {
  const [visibleContent, setVisibleContent] = useState<
    Record<string, string[]>
  >({});
  const toggleContentVisibility = (actionId: string, contentType: string) => {
    togglePost(actionId, contentType, setVisibleContent);
  };

  const {
    pbUserInfo,
    botPushes,
    buttonStates: buttonDisabled,
    parsedDataArray,
  } = usePushesContext();

  const { role } = useAuth();

  const { isLoadingPushes, fetchDataAsync } = useFetchPushes();
  console.log("Rendering component: ReadPosts");

  useEffect(() => {
    fetchDataAsync(true);
  });

  console.log("parsedDataArray:", parsedDataArray);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Messages From The Bot</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {role === "admin" && (
          <RawPushesDisplay pbUserInfo={pbUserInfo} botPushes={botPushes} />
        )}
        {isLoadingPushes ? (
          <IonCard className="skeleton">
            <IonCardHeader>
              <IonCardTitle>
                <IonSkeletonText animated className="skeleton-20" />
              </IonCardTitle>
            </IonCardHeader>
            <IonSkeletonText animated className="skeleton-10" />
            <IonSkeletonText animated className="skeleton-5" />
            <IonSkeletonText animated style={{ width: "6%" }} />
            <IonSkeletonText animated style={{ width: "7%" }} />
            <IonSkeletonText animated style={{ width: "7.5%" }} />
            <IonSkeletonText animated className="skeleton-25" />
          </IonCard>
        ) : (
          <>
            {parsedDataArray.map((parsedData, index) => (
              <ParsedDataCard
                key={parsedData["Action ID"] || index}
                parsedData={parsedData}
                isButtonDisabled={
                  buttonDisabled[parsedData["Action ID"]] === "done"
                }
                visibleContent={visibleContent}
                toggleContentVisibility={toggleContentVisibility}
                botPushes={botPushes}
              />
            ))}
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default ReadPosts;
