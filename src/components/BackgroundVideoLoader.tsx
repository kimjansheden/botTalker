import React, { Suspense, lazy } from "react";
import "../themes/css/BackgroundVideo.css";
import { IonSpinner } from "@ionic/react";

const LazyBackgroundVideoContent = lazy(() => import("./ui/BackgroundVideo"));

const BackgroundVideo: React.FC = () => {
  return (
    <Suspense fallback={<IonSpinner />}>
      <LazyBackgroundVideoContent />
    </Suspense>
  );
};

export default BackgroundVideo;
