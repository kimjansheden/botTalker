import { IonButton, IonTextarea } from "@ionic/react";
import { formatQuotedPost } from "./Format";
import { useRef, useState } from "react";
import UpdateGeneratedAnswer from "./UpdateGeneratedAnswer";
import { usePushesContext } from "../hooks/usePushesContext";
import useAutoResizeTextarea from "../hooks/useAutoResizeTextarea";
import { useAuth } from "../provider/AuthProvider";
import useToast from "../hooks/useToast";

/**
 * `CollapsibleSection` is a component that renders a button to toggle the visibility of a content section.
 * If the content type is visible, it shows a button to hide it; otherwise, it shows a button to reveal it.
 * When visible, the content is displayed formatted within a `pre` tag.
 *
 * @component
 * @param {string} actionId - The ID related to the specific action for which content visibility is controlled.
 * @param {string} contentType - The type of content that this section should handle.
 * @param {Record<string, string[]>} visibleContent - An object that tracks the visibility of different content types.
 * @param {(actionId: string, contentType: string) => void} toggleContentVisibility - A function to toggle the visibility of the content.
 * @param {string} content - The actual content to be displayed when the section is expanded.
 */
const CollapsibleSection: React.FC<{
  actionId: string;
  contentType: string;
  visibleContent: Record<string, string[]>;
  toggleContentVisibility: (actionId: string, contentType: string) => void;
  content: string;
}> = ({
  actionId,
  contentType,
  visibleContent,
  toggleContentVisibility,
  content,
}) => {
  const isVisible = visibleContent[actionId]?.includes(contentType);
  const [editedContent, setEditedContent] = useState(content);
  const isGeneratedAnswer = contentType === "Generated Answer";
  const { botPushes } = usePushesContext();
  const { pushBulletApiKey } = useAuth();
  const { presentDangerToast, presentSuccessToast } = useToast();
  const token = pushBulletApiKey;
  const textareaRef = useRef<HTMLIonTextareaElement>(null);

  console.log("visibleContent:", visibleContent);

  useAutoResizeTextarea(textareaRef, editedContent, isVisible);

  if (!token) {
    console.error("No PushBullet API key found in CollapsibleSection.");
    presentDangerToast(
      "No PushBullet API key found. Please make sure you have set the key in Bot Settings."
    );
    return null;
  }

  return (
    <div>
      <IonButton onClick={() => toggleContentVisibility(actionId, contentType)}>
        {isVisible ? `Hide ${contentType}` : `Show ${contentType}`}
      </IonButton>
      {isVisible && (
        <div>
          {
            // If the content type is generated answer, show a textarea for editing.
            // Else, show the content as <pre> formatQuotedPost.
          }
          {isGeneratedAnswer ? (
            <IonTextarea
              value={editedContent}
              ref={textareaRef}
              aria-label="Generated Answer"
              autoGrow={true}
              onIonChange={(e) => setEditedContent(e.detail.value!)}
            />
          ) : (
            <pre>{formatQuotedPost(content)}</pre>
          )}
          {
            // If the content type is generated answer, show a save button
          }
          {isGeneratedAnswer && (
            <UpdateGeneratedAnswer
              actionId={actionId}
              newGeneratedAnswer={editedContent}
              botPushes={botPushes}
              token={token}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;
