import mongoose from "mongoose";

const appConfigSchema = new mongoose.Schema(
  {
    appName:       { type: String, default: "EduMaster" },
    tagline:       { type: String, default: "Learn. Grow. Succeed." },
    primaryColor:  { type: String, default: "#1A4FA0" },
    accentColor:   { type: String, default: "#2E7FD9" },
    splashBgColor: { type: String, default: "#1C1E2B" },
    logoUrl:       { type: String, default: "" },
    splashLogoUrl: { type: String, default: "" },
    // App distribution
    androidApkUrl:    { type: String, default: "" }, // Direct APK download link
    iosSimulatorUrl:  { type: String, default: "" }, // iOS Simulator .tar.gz download
    iosTestFlightUrl: { type: String, default: "" }, // TestFlight invite link (requires Apple Dev account)
    expoProjectUrl:   { type: String, default: "" }, // expo.dev project page
    appVersion:       { type: String, default: "1.0.0" },
    buildNumber:      { type: String, default: "" },
    releaseNotes:     { type: String, default: "" },
  },
  { timestamps: true }
);

const AppConfig = mongoose.model("AppConfig", appConfigSchema);

export default AppConfig;
