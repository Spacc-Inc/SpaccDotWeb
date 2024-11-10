package org.eu.spacc.spaccdotweb.android.webview;

import android.annotation.SuppressLint;
import android.content.Context;
import android.util.AttributeSet;
import android.webkit.WebSettings;
import android.webkit.WebView;
import org.eu.spacc.spaccdotweb.android.Config;
import org.eu.spacc.spaccdotweb.android.helpers.ConfigReader;
import org.eu.spacc.spaccdotweb.android.utils.ApiUtils;

public class SpaccWebView extends WebView {
    private Config config;

    @SuppressLint("SetJavaScriptEnabled")
    public SpaccWebView(Context context, AttributeSet attrs) {
        super(context, attrs);
        this.setWebViewClient(new WebViewClient(context));
        this.setWebChromeClient(new WebChromeClient(context));
        this.setDownloadListener(new DownloadListener(context));
        this.config = new Config();
        this.applyConfig(context);
    }

    // TODO: Implement context menu (long-press on links, images, etc...)
//    @Override
//    protected void onCreateContextMenu(ContextMenu menu) {
//        super.onCreateContextMenu(menu);
//    }

    private void applyConfig(Context context) {
        WebSettings webSettings = this.getSettings();

        webSettings.setJavaScriptEnabled(config.getAllowJavascript());

        boolean allowStorage = config.getAllowStorage();
        ApiUtils.apiRun(7, () -> webSettings.setDomStorageEnabled(allowStorage));
        ApiUtils.apiRun(5, () -> webSettings.setDatabaseEnabled(allowStorage));
        if (allowStorage) {
            ApiUtils.apiRun(5, () -> webSettings.setDatabasePath(context.getDir("databases", 0).getAbsolutePath()));
        }

        ApiUtils.apiRun(3, () -> webSettings.setAllowFileAccess(false));
    }

    public void loadConfig(Context context, int configResource) {
        this.config = new Config(new ConfigReader(context, configResource));
        this.applyConfig(context);
    }

    public void loadAppIndex() {
        String url = null;
        switch (config.getAppIndex()) {
            case LOCAL:
                url = ("file:///android_asset/" + config.getLocalIndex());
                break; 
            case REMOTE:
                url = config.getRemoteIndex();
                break;
        }
        this.loadUrl(url);
    }
}
