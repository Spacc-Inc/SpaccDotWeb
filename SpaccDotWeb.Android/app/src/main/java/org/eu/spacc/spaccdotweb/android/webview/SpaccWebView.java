package org.eu.spacc.spaccdotweb.android.webview;

import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.util.AttributeSet;
import android.view.ContextMenu;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.util.ArrayList;

import org.eu.spacc.spaccdotweb.android.Config;
import org.eu.spacc.spaccdotweb.android.SpaccWebViewActivity;
import org.eu.spacc.spaccdotweb.android.helpers.ConfigReader;
import org.eu.spacc.spaccdotweb.android.utils.ApiUtils;

public class SpaccWebView extends WebView {
    private Config config;
    private Context context;
    private SpaccWebViewClient webViewClient;
    private SpaccWebChromeClient webChromeClient;

    private int openString;
    private int openExternallyString;
    private int copyUrlString;

    private Boolean isLoaded = false;
    protected ArrayList<String> scriptQueue = new ArrayList<>();

    public SpaccWebView(Context context) {
        super(context);
        setup(context);
    }

    public SpaccWebView(Context context, AttributeSet attrs) {
        super(context, attrs);
        setup(context);
    }

    private void setup(Context context) {
        this.context = context;
        this.setWebViewClient(this.webViewClient = new SpaccWebViewClient(context));
        this.setWebChromeClient(this.webChromeClient = new SpaccWebChromeClient((SpaccWebViewActivity)context));
        this.setDownloadListener(new DownloadListener(context));
        this.config = new Config();
        this.applyConfig(context);
    }

    public void setStrings(int open, int openExternally, int copyUrl) {
        openString = open;
        openExternallyString = openExternally;
        copyUrlString = copyUrl;
    }

    @Override
    public void setWebViewClient(WebViewClient client) {
        super.setWebViewClient(client);
        webViewClient = (SpaccWebViewClient)client;
        webViewClient.applyConfig(config);
    }

    @Override
    public void setWebChromeClient(WebChromeClient client) {
        super.setWebChromeClient(client);
        webChromeClient = (SpaccWebChromeClient)client;
        webChromeClient.applyConfig(config);
    }

    // TODO: Implement context menu (long-press on links, images, etc...)
    @Override
    protected void onCreateContextMenu(ContextMenu menu) {
        super.onCreateContextMenu(menu);
        HitTestResult result = getHitTestResult();
        /*switch (result.getType()) {
            case HitTestResult.UNKNOWN_TYPE:
            case HitTestResult.IMAGE_TYPE:
            case HitTestResult.SRC_ANCHOR_TYPE:
            case HitTestResult.SRC_IMAGE_ANCHOR_TYPE:*/
                String href = result.getExtra();
                if (href != null) {
                    menu.setHeaderTitle(href);
                    menu.add(openString).setOnMenuItemClickListener(menuItem -> {
                        if (!webViewClient.shouldOverrideUrlLoading(this, href)) {
                            this.loadUrl(href);
                        }
                        return false;
                    });
                    if (!ApiUtils.isInternalUrl(Uri.parse(href))) {
                        menu.add(openExternallyString).setOnMenuItemClickListener(menuItem -> {
                            ApiUtils.openOrShareUrl(context, Uri.parse(href));
                            return false;
                        });
                    }
                    menu.add(copyUrlString).setOnMenuItemClickListener(menuItem -> {
                        ApiUtils.writeToClipboard(context, href);
                        return false;
                    });
                }
                /*break;
        }*/
    }

    public void injectScript(String script) {
        if (isLoaded) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                this.evaluateJavascript(script, null);
            } else {
                this.loadUrl("javascript:(function(){" + script + "})();");
            }
        } else {
            scriptQueue.add(script);
        }
    }

    public void injectStyle(String style) {
        injectScript("document.head.appendChild(Object.assign(document.createElement('style'),{innerHTML:\"" + style + "\"}))");
    }

    protected void setLoaded(Boolean loaded) {
        if (isLoaded = loaded) {
            for (String script : scriptQueue) {
                injectScript(script);
            }
            scriptQueue.clear();
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

        ApiUtils.apiRun(17, () -> webSettings.setMediaPlaybackRequiresUserGesture(!config.getAllowAutoplay()));

        webSettings.setStandardFontFamily(config.getStandardFontFamily());
        ApiUtils.apiRun(3, () -> webSettings.setUserAgentString(config.getUserAgent()));

        ApiUtils.apiRun(3, () -> webSettings.setBuiltInZoomControls(config.getAllowZoomControls()));
        ApiUtils.apiRun(11, () -> webSettings.setDisplayZoomControls(config.getDisplayZoomControls()));

        webViewClient.applyConfig(config);
        webChromeClient.applyConfig(config);
    }

    public void loadConfig(Context context, int configResource) {
        this.config = new Config(new ConfigReader(context, configResource));
        this.applyConfig(context);
    }

    public Config getConfig() {
        return config;
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
