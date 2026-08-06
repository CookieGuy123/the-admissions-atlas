import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.admissionsatlas.app',
  appName: 'The Admissions Atlas',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
