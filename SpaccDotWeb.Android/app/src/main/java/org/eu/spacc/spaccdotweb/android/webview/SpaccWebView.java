package org.eu.spacc.spaccdotweb.android.webview;

import android.content.Context;
import android.net.Uri;
import android.util.AttributeSet;
import android.view.ContextMenu;
import android.webkit.WebSettings;
import android.webkit.WebView;
import org.eu.spacc.spaccdotweb.android.Config;
import org.eu.spacc.spaccdotweb.android.SpaccWebViewActivity;
import org.eu.spacc.spaccdotweb.android.helpers.ConfigReader;
import org.eu.spacc.spaccdotweb.android.utils.ApiUtils;

public class SpaccWebView extends WebView {
    private Config config;
    private Context context;

    public SpaccWebView(Context context, AttributeSet attrs) {
        super(context, attrs);
        this.context = context;
        this.setWebViewClient(new SpaccWebViewClient(context));
        this.setWebChromeClient(new SpaccWebChromeClient((SpaccWebViewActivity)context));
        this.setDownloadListener(new DownloadListener(context));
        this.config = new Config();
        this.applyConfig(context);
    }

    // TODO: Implement context menu (long-press on links, images, etc...)
    @Override
    protected void onCreateContextMenu(ContextMenu menu) {
        super.onCreateContextMenu(menu);
        HitTestResult result = getHitTestResult();
        switch (result.getType()) {
            case HitTestResult.SRC_ANCHOR_TYPE:
            case HitTestResult.SRC_IMAGE_ANCHOR_TYPE:
                String href = result.getExtra();
                menu.setHeaderTitle(href);
                menu.add("Copy URL").setOnMenuItemClickListener(menuItem -> {
                    ApiUtils.writeToClipboard(context, href);
                    return false;
                });
                menu.add("Open or Share Externally").setOnMenuItemClickListener(menuItem -> {
                    ApiUtils.openOrShareUrl(context, Uri.parse(href));
                    return false;
                });
                break;
        }
    }

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

        webSettings.setStandardFontFamily(config.getStandardFontFamily());
        ApiUtils.apiRun(3, () -> webSettings.setUserAgentString(config.getUserAgent()));

        ApiUtils.apiRun(3, () -> webSettings.setBuiltInZoomControls(config.getAllowZoomControls()));
        ApiUtils.apiRun(11, () -> webSettings.setDisplayZoomControls(config.getDisplayZoomControls()));
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
