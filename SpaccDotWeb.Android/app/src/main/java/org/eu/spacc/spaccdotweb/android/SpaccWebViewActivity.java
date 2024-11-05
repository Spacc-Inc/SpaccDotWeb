package org.eu.spacc.spaccdotweb.android;

import android.annotation.SuppressLint;
import android.app.Activity;
import java.io.File;

public class SpaccWebViewActivity extends Activity {
    protected SpaccWebView webView;

    @Override
    public void onBackPressed() {
        if (this.webView.canGoBack()) {
            this.webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @SuppressLint("NewApi") // We have our custom implementation
    @Override
    public File getDataDir() {
        return getApplicationContext().getDataDir();
    }

    @Override
    public File getDir(String name, int mode) {
        return getApplicationContext().getDir(name, mode);
    }

    @Override
    public File getFilesDir() {
        return getApplicationContext().getFilesDir();
    }

    @Override
    public File getCacheDir() {
        return getApplicationContext().getCacheDir();
    }

    @Override
    public File getDatabasePath(String name) {
        return getApplicationContext().getDatabasePath(name);
    }
}
