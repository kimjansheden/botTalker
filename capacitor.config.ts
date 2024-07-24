import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "flashbackbot.se.kimjansheden",
  appName: "FlashbackBot",
  webDir: "dist",
  server: {
    androidScheme: "https",
    iosScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;
