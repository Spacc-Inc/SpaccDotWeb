package org.eu.spacc.spaccdotweb.android;

import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.webkit.WebView;
import android.webkit.WebViewClient;
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
        // TODO: This should not override all HTTP links if the app loads from remote
        List<String> protocols = Arrays.asList("http", "https", "mailto", "ftp");
        if (protocols.contains(url.toLowerCase().split(":")[0])) {
            try {
                // Open the link externally
                context.startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
            } catch (ActivityNotFoundException ignored) {
                // No app can handle it, so share it instead
                context.startActivity(new Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_TEXT, url));
            }
            return true;
        } else {
            return super.shouldOverrideUrlLoading(view, url);
        }
    }
}
