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

    /**
     * Called from JS: SystemBars.setDarkMode({ dark: true/false })
     * Sets both navigation bar color and icon appearance to match dark/light mode.
     */
    @PluginMethod
    public void setDarkMode(PluginCall call) {
        boolean dark = Boolean.TRUE.equals(call.getBoolean("dark", true));

        getActivity().runOnUiThread(() -> {
            Window window = getActivity().getWindow();
            int navColor = dark ? Color.parseColor("#141218") : Color.parseColor("#ffffff");
            window.setNavigationBarColor(navColor);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                // API 30+: use WindowInsetsController
                WindowInsetsController controller = window.getInsetsController();
                if (controller != null) {
                    if (dark) {
                        // Dark nav bar → light (white) icons
                        controller.setSystemBarsAppearance(0,
                            WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS);
                    } else {
                        // Light nav bar → dark icons
                        controller.setSystemBarsAppearance(
                            WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
                            WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS);
                    }
                }
            } else {
                // API 26-29: use View flags
                View decorView = window.getDecorView();
                int flags = decorView.getSystemUiVisibility();
                if (dark) {
                    flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                } else {
                    flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                }
                decorView.setSystemUiVisibility(flags);
            }
        });

        call.resolve();
    }
}
