package org.eu.spacc.spaccdotweb.android;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

public class SpaccWebChromeClient extends WebChromeClient {
    private static final int INPUT_FILE_REQUEST_CODE = 1;

    private final Context context;

    public SpaccWebChromeClient(Context context) {
        super();
        this.context = context;
    }

    // TODO: This only opens a file selector but then doesn't do anything
    // TODO: Android < 5 support
    @Override
    public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
        Intent contentSelectionIntent = new Intent(Intent.ACTION_GET_CONTENT);
        contentSelectionIntent.addCategory(Intent.CATEGORY_OPENABLE);
        contentSelectionIntent.setType("*/*"); // TODO: Read type from HTML input
        Intent chooserIntent = new Intent(Intent.ACTION_CHOOSER);
        chooserIntent.putExtra(Intent.EXTRA_INTENT, contentSelectionIntent);
        ((Activity)context).startActivityForResult(chooserIntent, INPUT_FILE_REQUEST_CODE);
        return true;
    }
}
