package org.eu.spacc.spaccdotweb.android.webview;

import android.content.Context;
import android.net.Uri;
import android.webkit.WebView;
import org.eu.spacc.spaccdotweb.android.utils.ApiUtils;
import java.util.Arrays;
import java.util.List;

public class WebViewClient extends android.webkit.WebViewClient {
    private final Context context;

    public WebViewClient(Context context) {
        super();
        this.context = context;
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, String url) {
        // TODO: This should not override all HTTP links if the app loads from remote (which will allow proper internal navigation and file downloads)
        // NOTE: It seems like the WebView overrides loading of data: URIs before we can get it here...
        List<String> protocols = Arrays.asList("data", "http", "https", "mailto", "ftp");
        if (protocols.contains(url.toLowerCase().split(":")[0])) {
            ApiUtils.openOrShareUrl(context, Uri.parse(url));
            return true;
        } else {
            return super.shouldOverrideUrlLoading(view, url);
        }
    }
}
