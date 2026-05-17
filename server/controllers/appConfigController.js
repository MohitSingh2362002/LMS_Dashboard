import asyncHandler from "../utils/asyncHandler.js";
import AppConfig from "../models/AppConfig.js";

/**
 * @desc  Upload a branding image (logo / splash logo) to S3
 * @route POST /api/app-config/upload
 * @access Private / Admin
 */
export const uploadBrandingImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No image file provided");
  }
  // uploadMiddleware normalises the S3 URL (or local path) to req.file.storedPath
  const url = req.file.storedPath ?? req.file.location ?? `/uploads/${req.file.filename}`;
  res.json({ url });
});

/**
 * @desc  Get the single AppConfig document (creates default if none exists)
 * @route GET /api/app-config
 * @access Public
 */
export const getAppConfig = asyncHandler(async (req, res) => {
  let config = await AppConfig.findOne();
  if (!config) {
    config = await AppConfig.create({});
  }
  res.json(config);
});

/**
 * @desc  Update the single AppConfig document
 * @route PUT /api/app-config
 * @access Private / Admin
 */
export const updateAppConfig = asyncHandler(async (req, res) => {
  let config = await AppConfig.findOne();
  if (!config) {
    config = await AppConfig.create({});
  }

  const {
    appName, tagline, primaryColor, accentColor, splashBgColor,
    logoUrl, splashLogoUrl,
    androidApkUrl, iosSimulatorUrl, iosTestFlightUrl, expoProjectUrl,
    appVersion, buildNumber, releaseNotes,
  } = req.body;

  if (appName          !== undefined) config.appName          = appName;
  if (tagline          !== undefined) config.tagline          = tagline;
  if (primaryColor     !== undefined) config.primaryColor     = primaryColor;
  if (accentColor      !== undefined) config.accentColor      = accentColor;
  if (splashBgColor    !== undefined) config.splashBgColor    = splashBgColor;
  if (logoUrl          !== undefined) config.logoUrl          = logoUrl;
  if (splashLogoUrl    !== undefined) config.splashLogoUrl    = splashLogoUrl;
  if (androidApkUrl    !== undefined) config.androidApkUrl    = androidApkUrl;
  if (iosSimulatorUrl  !== undefined) config.iosSimulatorUrl  = iosSimulatorUrl;
  if (iosTestFlightUrl !== undefined) config.iosTestFlightUrl = iosTestFlightUrl;
  if (expoProjectUrl   !== undefined) config.expoProjectUrl   = expoProjectUrl;
  if (appVersion       !== undefined) config.appVersion       = appVersion;
  if (buildNumber      !== undefined) config.buildNumber      = buildNumber;
  if (releaseNotes     !== undefined) config.releaseNotes     = releaseNotes;

  const updated = await config.save();
  res.json(updated);
});
