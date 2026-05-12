import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",          // show our own update prompt, not auto-reload
      includeAssets: ["icon-192.svg", "icon-512.svg", "icon-maskable.svg"],

      // ── Web App Manifest ──────────────────────────────────────────────────
      manifest: {
        name: "EduMaster LMS",
        short_name: "EduMaster",
        description: "Your complete learning management system — courses, live classes, recordings and more.",
        theme_color: "#1A4FA0",
        background_color: "#1A4FA0",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        categories: ["education", "productivity"],
        icons: [
          {
            src: "/icon-192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any"
          },
          {
            src: "/icon-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any"
          },
          {
            src: "/icon-maskable.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "maskable"
          }
        ],
        screenshots: [
          {
            src: "/icon-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            form_factor: "narrow",
            label: "EduMaster LMS home screen"
          }
        ]
      },

      // ── Workbox caching strategy ──────────────────────────────────────────
      workbox: {
        // Cache the app shell (HTML, JS, CSS)
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],

        // Runtime caching rules
        runtimeCaching: [
          {
            // API calls — network first, fall back to cache (30s timeout)
            urlPattern: /^https?:\/\/.*\/api\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 30,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24       // 1 day
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // Bunny CDN video thumbnails — cache first
            urlPattern: /^https:\/\/.*\.bunnycdn\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "bunny-assets",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7  // 7 days
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // External images / avatars
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "images",
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 60 * 60 * 24 * 30  // 30 days
              }
            }
          },
          {
            // Google Fonts (if ever added)
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts-stylesheets" }
          }
        ]
      },

      // Keep SW off in dev — workbox-build requires Node 20+ crypto globals
      // which Node 18 doesn't expose without the flag. SW only runs in prod builds.
      devOptions: {
        enabled: false
      }
    })
  ],

  // load .env from the monorepo root (one level up from client/)
  envDir: path.resolve(__dirname, ".."),
  server: {
    port: 5173,
    open: true,
    allowedHosts: true
  }
});
