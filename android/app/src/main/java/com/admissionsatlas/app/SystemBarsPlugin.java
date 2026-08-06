package com.admissionsatlas.app;

import android.graphics.Color;
import android.os.Build;
import android.view.View;
import android.view.Window;
import android.view.WindowInsetsController;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SystemBars")
public class SystemBarsPlugin extends Plugin {

    @Override
    public void load() {
        android.util.Log.d("SystemBars", "SystemBars plugin loaded and registered successfully!");
    }

    /**
     * Called from JS: SystemBars.setDarkMode({ dark: true/false })
     * Sets status bar AND navigation bar colors + icon appearance.
     */
    @PluginMethod
    public void setDarkMode(PluginCall call) {
        boolean dark = Boolean.TRUE.equals(call.getBoolean("dark", true));
        android.util.Log.d("SystemBars", "setDarkMode invoked natively, dark = " + dark);

        int statusColor = dark ? Color.parseColor("#141218") : Color.parseColor("#ffffff");
        int navColor    = dark ? Color.parseColor("#141218") : Color.parseColor("#ffffff");

        getActivity().runOnUiThread(() -> {
            Window window = getActivity().getWindow();
            
            // Required to let us draw custom colors on status bar and navigation bar
            window.addFlags(android.view.WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);

            window.setStatusBarColor(statusColor);
            window.setNavigationBarColor(navColor);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                // API 30+: WindowInsetsController
                WindowInsetsController ctrl = window.getInsetsController();
                if (ctrl != null) {
                    int lightFlags = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                                   | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
                    if (dark) {
                        // Dark bars → light (white) icons
                        ctrl.setSystemBarsAppearance(0, lightFlags);
                    } else {
                        // Light bars → dark icons
                        ctrl.setSystemBarsAppearance(lightFlags, lightFlags);
                    }
                }
            } else {
                // API 26–29: View flags
                View decorView = window.getDecorView();
                int flags = decorView.getSystemUiVisibility();
                if (dark) {
                    // Remove "light" flags → icons become white
                    flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                    flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                } else {
                    // Add "light" flags → icons become dark
                    flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                    flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                }
                decorView.setSystemUiVisibility(flags);
            }
        });

        call.resolve();
    }
}
