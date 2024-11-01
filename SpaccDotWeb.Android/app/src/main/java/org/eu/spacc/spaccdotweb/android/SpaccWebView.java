package org.eu.spacc.spaccdotweb.android;

import android.annotation.SuppressLint;
import android.content.Context;
import android.util.AttributeSet;
import android.webkit.WebSettings;
import android.webkit.WebView;

public class SpaccWebView extends WebView {

    @SuppressLint("SetJavaScriptEnabled")
    public SpaccWebView(Context context, AttributeSet attrs) {
        super(context, attrs);

        WebSettings webSettings = getSettings();

        webSettings.setJavaScriptEnabled(Config.ALLOW_JAVASCRIPT);

        ApiUtils.apiRun(7, () -> webSettings.setDomStorageEnabled(Config.ALLOW_STORAGE));
        ApiUtils.apiRun(5, () -> webSettings.setDatabaseEnabled(Config.ALLOW_STORAGE));
        if (Config.ALLOW_STORAGE) {
            ApiUtils.apiRun(5, () -> webSettings.setDatabasePath(context.getFilesDir().getParent() + "/databases"));
        }

        ApiUtils.apiRun(3, () -> webSettings.setAllowFileAccess(true));
    }

    public void loadAppIndex() {
        String url = null;

        switch (Config.APP_INDEX) {
            case LOCAL:
                url = ("file:///android_asset/" + Config.LOCAL_INDEX);
                break; 
            case REMOTE:
                url = Config.REMOTE_INDEX;
                break;
        }

        loadUrl(url);
    }
}