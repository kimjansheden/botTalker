import React, { useEffect, useRef } from "react";
import { IonThumbnail } from "@ionic/react";
import { PiRobot } from "react-icons/pi";
import { IconType } from "react-icons";

const RandomAnimateIcon: React.FC = () => {
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const applyRandomAnimation = (icon: IconType) => {
      if (iconRef.current) {
        const shouldAnimate = Math.random() > 0.5; // 50% chance to animate
        if (shouldAnimate) {
          iconRef.current.classList.add("move");
          setTimeout(() => {
            if (iconRef.current) {
              iconRef.current.classList.remove("move");
            }
          }, 1000); // Animation lasts for 1 second
        }
      }
    };

    const interval = setInterval(applyRandomAnimation, 2000); // Try to animate every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <IonThumbnail>
      <div ref={iconRef}>
        <PiRobot style={{ width: "100%", height: "100%" }} />
      </div>
    </IonThumbnail>
  );
};

export default RandomAnimateIcon;
