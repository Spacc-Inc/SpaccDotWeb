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

import org.eu.spacc.spaccdotweb.android.utils.ApiUtils;
import org.eu.spacc.spaccdotweb.android.helpers.DataMoveHelper;
import org.eu.spacc.spaccdotweb.android.SpaccWebViewActivity;
import org.eu.spacc.spaccdotweb.android.webview.SpaccWebViewClient;

public class MainActivity extends SpaccWebViewActivity {
    private ActionBar actionBar = null;
    private Menu menu = null;
    private long pageStartTime = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        ApiUtils.apiRun(11, () -> this.actionBar = getActionBar());

        DataMoveHelper.run(this, R.string.exit, R.string.move_app_data, R.string.move_app_data_info);

        this.webView = findViewById(R.id.webview);
        this.webView.setStrings(R.string.open_menu, R.string.open_externally_menu, R.string.copy_url_menu);
        this.webView.setWebViewClient(new SpaccWebViewClient(this) {
            @SuppressLint("UseRequiresApi")
            @TargetApi(Build.VERSION_CODES.HONEYCOMB)
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                pageStartTime = System.currentTimeMillis();
                if (menu != null) {
                    menu.findItem(R.id.stop).setVisible(true);
                    menu.findItem(R.id.reload).setVisible(false);
                    menu.findItem(R.id.open_externally).setVisible(!ApiUtils.isInternalUrl(Uri.parse(url)));
                    menu.findItem(R.id.about_app).setVisible(webView.getConfig().getAboutPage() != null);
                    menu.findItem(R.id.backwards).setEnabled(webView.canGoBack());
                    menu.findItem(R.id.forward).setEnabled(webView.canGoForward());
                }
                if (actionBar != null) {
                    actionBar.setSubtitle(R.string.loading);
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
                if (menu != null) {
                    menu.findItem(R.id.stop).setVisible(false);
                    menu.findItem(R.id.reload).setVisible(true);
                }
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
        switch (item.getItemId()) {
            case R.id.stop:
                this.webView.stopLoading();
                break;
            case R.id.reload:
                this.webView.reload();
                break;
            case R.id.backwards:
                this.webView.goBack();
                break;
            case R.id.forward:
                this.webView.goForward();
                break;
            case R.id.copy_url:
                ApiUtils.writeToClipboard(this, webView.getUrl());
                break;
            case R.id.open_externally:
                ApiUtils.openOrShareUrl(this, Uri.parse(webView.getUrl()));
                break;
            case R.id.exec_script:
                EditText scriptText = new EditText(this);
                new AlertDialog.Builder(this)
                    .setTitle(R.string.execute_javascript)
                    .setView(scriptText)
                    .setPositiveButton("OK", (dialogInterface, i) -> webView.injectScript(scriptText.getText().toString()))
                    .setNeutralButton(R.string.cancel, null)
                    .show();
                break;
            case R.id.hide:
                actionBar.hide();
                break;
            case R.id.exit:
                finish();
                break;
            case R.id.about_app:
                ApiUtils.openOrShareUrl(this, Uri.parse(webView.getConfig().getAboutPage()));
                break;
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
