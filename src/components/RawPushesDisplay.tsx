import React, { useState } from "react";
import { IonButton } from "@ionic/react";
import { ApiResponse, PendingAnswers } from "../../common/types";

interface RawPushesDisplayProps {
  pbUserInfo: ApiResponse;
  botPushes: PendingAnswers;
}

const RawPushesDisplay: React.FC<RawPushesDisplayProps> = ({
  pbUserInfo,
  botPushes,
}) => {
  const [isShowInfoOpen, setIsShowInfoOpen] = useState(false);

  return (
    <>
      <IonButton onClick={() => setIsShowInfoOpen(!isShowInfoOpen)}>
        {isShowInfoOpen ? "Hide Raw Pushes Data" : "Show Raw Pushes Data"}
      </IonButton>

      {isShowInfoOpen && (
        <div>
          <pre>{JSON.stringify(pbUserInfo, null, 2)}</pre>
          <pre>{JSON.stringify(botPushes, null, 2)}</pre>
        </div>
      )}
    </>
  );
};

export default RawPushesDisplay;
