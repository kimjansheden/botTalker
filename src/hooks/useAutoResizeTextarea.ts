import { useEffect, RefObject } from "react";

const useAutoResizeTextarea = (
  textareaRef: RefObject<HTMLIonTextareaElement>,
  editedContent: string,
  isVisible: boolean
) => {
  useEffect(() => {
    if (isVisible && textareaRef.current) {
      setTimeout(() => {
        const textarea = textareaRef.current?.querySelector("textarea");
        if (textarea) {
          textarea.style.height = "auto"; // Reset height
          textarea.style.height = `${textarea.scrollHeight}px`; // Set to scroll height
        }
      }, 0); // Ensure this runs after rendering
    }
  }, [isVisible, editedContent]); // Re-run the effect when editedContent or isVisible changes
};

export default useAutoResizeTextarea;
