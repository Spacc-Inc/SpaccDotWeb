package org.eu.spacc.spaccdotweb.android.webview;

import android.annotation.SuppressLint;
import android.content.Context;
import android.util.AttributeSet;
import android.view.ContextMenu;
import android.webkit.WebSettings;
import android.webkit.WebView;

import org.eu.spacc.spaccdotweb.android.utils.ApiUtils;
import org.eu.spacc.spaccdotweb.android.Config;

public class SpaccWebView extends WebView {

    @SuppressLint("SetJavaScriptEnabled")
    public SpaccWebView(Context context, AttributeSet attrs) {
        super(context, attrs);
        this.setWebViewClient(new WebViewClient(context));
        this.setWebChromeClient(new WebChromeClient(context));
        this.setDownloadListener(new DownloadListener(context));

        WebSettings webSettings = this.getSettings();

        webSettings.setJavaScriptEnabled(Config.ALLOW_JAVASCRIPT);

        ApiUtils.apiRun(7, () -> webSettings.setDomStorageEnabled(Config.ALLOW_STORAGE));
        ApiUtils.apiRun(5, () -> webSettings.setDatabaseEnabled(Config.ALLOW_STORAGE));
        if (Config.ALLOW_STORAGE) {
            ApiUtils.apiRun(5, () -> webSettings.setDatabasePath(context.getDir("databases", 0).getAbsolutePath()));
        }

        ApiUtils.apiRun(3, () -> webSettings.setAllowFileAccess(false));
    }

    // TODO: Implement context menu (long-press on links, images, etc...)
//    @Override
//    protected void onCreateContextMenu(ContextMenu menu) {
//        super.onCreateContextMenu(menu);
//    }

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
