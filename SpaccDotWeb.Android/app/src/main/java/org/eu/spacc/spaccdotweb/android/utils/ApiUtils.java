package org.eu.spacc.spaccdotweb.android.utils;

import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;

public class ApiUtils {

    public static void apiRun(int apiLevel, Runnable action) {
        if (Build.VERSION.SDK_INT >= apiLevel) {
            action.run();
        }
    }

    public static void openOrShareUrl(Context context, Uri url) {
        try {
            // Open the URL externally
            context.startActivity(new Intent(Intent.ACTION_VIEW, url));
        } catch (ActivityNotFoundException ignored) {
            // No app can handle it, so share it instead
            context.startActivity(new Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, url.toString()));
        }
    }
}
