package com.example.spaccwebviewapplication;

import android.app.Activity;
import android.os.Bundle;
import org.eu.spacc.spaccdotweb.android.*;

public class MainActivity extends Activity {
    private SpaccWebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        setContentView(R.layout.activity_main);
        webView = findViewById(R.id.webview);

        webView.loadAppIndex();
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
