import { registerPlugin } from "@capacitor/core";

interface SystemBarsPlugin {
  setDarkMode(options: { dark: boolean }): Promise<void>;
}

// Registers the native Android plugin, silently falls back to a no-op on web
const SystemBars = registerPlugin<SystemBarsPlugin>("SystemBars", {
  web: {
    setDarkMode: async () => {
      // No-op on web — CSS handles dark mode there
    },
  },
});

export { SystemBars };
