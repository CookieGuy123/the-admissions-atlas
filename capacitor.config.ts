import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.admissionsatlas.app',
  appName: 'The Admissions Atlas',
  webDir: 'dist',
  server: {
    // Used only during `cap run android --livereload`
    // Points the Android WebView at your local dev server (port 3000 = Express+Vite)
    // Has NO effect on production APK builds — those always use bundled dist/ assets
    androidScheme: 'http',
  },
};

export default config;
