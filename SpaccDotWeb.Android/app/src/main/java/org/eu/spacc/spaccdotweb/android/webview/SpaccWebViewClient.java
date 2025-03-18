package org.eu.spacc.spaccdotweb.android.webview;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.eu.spacc.spaccdotweb.android.utils.ApiUtils;

import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.List;

public class SpaccWebViewClient extends WebViewClient {
    private final Context context;

    public SpaccWebViewClient(Context context) {
        super();
        this.context = context;
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView view, String url) {
        // TODO: This should not override all HTTP links if the app loads from remote (which will allow proper internal navigation and file downloads)
        // NOTE: It seems like the WebView overrides loading of data: URIs before we can get it here...
        List<String> externalProtocols = Arrays.asList("data", "http", "https", "mailto", "ftp");
        String protocol = url.toLowerCase().split(":")[0];
        if (protocol.equals("file")) {
            return super.shouldOverrideUrlLoading(view, url);
        } else if (protocol.equals("intent")) {
            ApiUtils.apiRun(4, () -> {
                try {
                    // TODO: Should this handle broadcasts and services differently?
                    context.startActivity(Intent.parseUri(url, 0));
                } catch (URISyntaxException e) {
                    throw new RuntimeException(e);
                }
            });
            return true;
        } else {
            ApiUtils.openOrShareUrl(context, Uri.parse(url));
            return true;
        }

    }
}
