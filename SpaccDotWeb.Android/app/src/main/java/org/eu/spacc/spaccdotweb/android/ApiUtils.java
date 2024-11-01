package org.eu.spacc.spaccdotweb.android;

import android.os.Build;

public class ApiUtils {

    public static void apiRun(int apiLevel, Runnable action) {
        if (Build.VERSION.SDK_INT >= apiLevel) {
            action.run();
        }
    }
}