import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.admissionsatlas.app',
  appName: 'The Admissions Atlas',
  webDir: 'dist',
  server: {
    url: 'https://the-admissions-atlas.vercel.app',
    androidScheme: 'https',
  },
};

export default config;
