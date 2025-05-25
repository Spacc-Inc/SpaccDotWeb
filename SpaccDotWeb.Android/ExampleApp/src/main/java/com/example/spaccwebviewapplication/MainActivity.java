package com.example.spaccwebviewapplication;

import android.annotation.SuppressLint;
import android.annotation.TargetApi;
import android.app.ActionBar;
import android.app.AlertDialog;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
import android.webkit.WebView;
import android.widget.EditText;

import org.eu.spacc.spaccwebview.android.utils.ApiUtils;
import org.eu.spacc.spaccwebview.android.helpers.DataMoveHelper;
import org.eu.spacc.spaccwebview.android.SpaccWebViewActivity;
import org.eu.spacc.spaccwebview.android.webview.SpaccWebViewClient;

public class MainActivity extends SpaccWebViewActivity {
    private ActionBar actionBar = null;
    private Menu menu = null;
    private long pageStartTime = 0;

    private void refreshMenu(boolean started) {
        if (menu != null) {
            menu.findItem(R.id.stop).setVisible(started);
            menu.findItem(R.id.reload).setVisible(!started);
            menu.findItem(R.id.about_app).setVisible(webView.getConfig().getAboutPage() != null);
            menu.findItem(R.id.backwards).setEnabled(webView.canGoBack());
            menu.findItem(R.id.forward).setEnabled(webView.canGoForward());
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        ApiUtils.apiRun(11, () -> this.actionBar = getActionBar());

        DataMoveHelper.run(this);

        this.webView = findViewById(R.id.webview);
        this.webView.setWebViewClient(new SpaccWebViewClient(this) {
            @SuppressLint("UseRequiresApi")
            @TargetApi(Build.VERSION_CODES.HONEYCOMB)
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                pageStartTime = System.currentTimeMillis();
                refreshMenu(true);
                if (menu != null) {
                    menu.findItem(R.id.open_externally).setVisible(!ApiUtils.isInternalUrl(Uri.parse(url)));
                }
                if (actionBar != null) {
                    actionBar.setSubtitle(org.eu.spacc.spaccwebview.android.R.string.loading);
                }
//                if (justStarted) {
//                    new Handler().postDelayed(() -> Objects.requireNonNull(getActionBar()).hide(), 3000);
//                    justStarted = false;
//                }
            }

            @SuppressLint("UseRequiresApi")
            @TargetApi(Build.VERSION_CODES.HONEYCOMB)
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                refreshMenu(false);
                if (actionBar != null && pageStartTime != 0) {
                    actionBar.setSubtitle("~" + (System.currentTimeMillis() - pageStartTime) + "ms");
                }
            }
        });
        this.webView.loadConfig(this, R.xml.app_config);
        this.webView.loadAppIndex();
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.main, menu);
        if (actionBar == null) {
            menu.findItem(R.id.hide).setVisible(false);
        }
        return super.onCreateOptionsMenu(this.menu = menu);
    }

    @SuppressLint({"NonConstantResourceId", "UseRequiresApi"})
    @TargetApi(Build.VERSION_CODES.HONEYCOMB)
    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        int id = item.getItemId();
        if (id == R.id.stop) {
            webView.stopLoading();
        } else if (id == R.id.reload) {
            webView.reload();
        } else if (id == R.id.backwards) {
            webView.goBack();
        } else if (id == R.id.forward) {
            webView.goForward();
        } else if (id == R.id.copy_url) {
            ApiUtils.writeToClipboard(this, webView.getUrl());
        } else if (id == R.id.open_externally) {
            ApiUtils.openOrShareUrl(this, Uri.parse(webView.getUrl()));
        } else if (id == R.id.exec_script) {
            EditText scriptText = new EditText(this);
            new AlertDialog.Builder(this)
                .setTitle(org.eu.spacc.spaccwebview.android.R.string.execute_javascript)
                .setView(scriptText)
                .setPositiveButton("OK", (dialogInterface, i) -> webView.injectScript(scriptText.getText().toString()))
                .setNeutralButton(org.eu.spacc.spaccwebview.android.R.string.cancel, null)
                .show();
        } else if (id == R.id.hide) {
            actionBar.hide();
        } else if (id == R.id.exit) {
            finish();
        } else if (id == R.id.about_app) {
            ApiUtils.openOrShareUrl(this, Uri.parse(webView.getConfig().getAboutPage()));
        }
        return super.onOptionsItemSelected(item);
    }

    @SuppressLint("UseRequiresApi")
    @TargetApi(Build.VERSION_CODES.HONEYCOMB)
    @Override
    public void onBackPressed() {
        if (actionBar == null) {
            super.onBackPressed();
        } else if (actionBar.isShowing()) {
            actionBar.hide();
        } else {
            actionBar.show();
        }
    }
}
