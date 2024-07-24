import React, { useEffect, useRef } from "react";
import "../../themes/css/BackgroundVideo.css";

const BackgroundVideo: React.FC = () => {
  // List of available video files
  const videos = [
    "./videos/8566827-uhd_2160_3840_30fps_compressed.mp4",
    "./videos/8464662-uhd_3840_2160_25fps_compressed.mp4",
    "./videos/8566809-uhd_2160_3840_30fps_compressed.mp4",
    "./videos/Robots_Rising_compressed_Ultra_High_original.mp4",
  ];

  // Function to randomly select a video from the list
  const getRandomVideo = () => {
    const randomIndex = Math.floor(Math.random() * videos.length);
    return videos[randomIndex];
  };

  const selectedVideo = getRandomVideo();
  console.log("Rendering BackgroundVideo");

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    console.log("Selected video:", selectedVideo);
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.5; // Set playback speed to 50%
    }
  }, [selectedVideo]);

  return (
    <div className="video-container">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      >
        <source src={selectedVideo} type="video/mp4" />
        Your browser does not support video playback.
      </video>
    </div>
  );
};

export default BackgroundVideo;
