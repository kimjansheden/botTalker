import { IonCard, IonCardContent, IonCardHeader, IonCardTitle } from "@ionic/react";
import React from "react";
import CollapsibleSection from "../CollapsibleSection";
import { HandleResponse } from "../HandleResponse";

interface ParsedDataCardProps {
  parsedData: { [key: string]: string };
  isButtonDisabled: boolean;
  visibleContent: Record<string, string[]>;
  toggleContentVisibility: (actionId: string, contentType: string) => void;
  botPushes: any;
}

const ParsedDataCard: React.FC<ParsedDataCardProps> = ({
  parsedData,
  isButtonDisabled,
  visibleContent,
  toggleContentVisibility,
  botPushes,
}) => {
  console.log("parsedData:", parsedData);
  const actionId = parsedData["Action ID"];
  return (
    <IonCard>
      <div className="pb-container">
      <IonCardHeader>
        <IonCardTitle><h1 className="small">Action ID: {actionId}</h1></IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div>
          <pre>
            <strong>Username:</strong> {parsedData["From Username"]}
          </pre>
        </div>
        <div>
          <pre>
            <strong>Quoted User:</strong> {parsedData["Quoted User"]}
          </pre>
        </div>
        <CollapsibleSection
          actionId={actionId}
          contentType="Quoted Post"
          visibleContent={visibleContent}
          toggleContentVisibility={toggleContentVisibility}
          content={parsedData["Quoted Post"]}
        />
        <CollapsibleSection
          actionId={actionId}
          contentType="What They Wrote"
          visibleContent={visibleContent}
          toggleContentVisibility={toggleContentVisibility}
          content={parsedData["Original Post"]}
        />
        <CollapsibleSection
          actionId={actionId}
          contentType="Generated Answer"
          visibleContent={visibleContent}
          toggleContentVisibility={toggleContentVisibility}
          content={parsedData["Generated Answer"]}
        />
        <HandleResponse
          actionId={actionId}
          isButtonDisabled={isButtonDisabled}
          botPushes={botPushes}
        />
      </IonCardContent>
      </div>
    </IonCard>
  );
};

export default ParsedDataCard;
