package org.eu.spacc.spaccdotweb.android;

import android.annotation.SuppressLint;
import android.app.Activity;
import org.eu.spacc.spaccdotweb.android.webview.SpaccWebView;
import java.io.File;

public class SpaccWebViewActivity extends Activity {
    protected SpaccWebView webView;

//    @Override
//    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
//        super.onActivityResult(requestCode, resultCode, data);
//        if (requestCode == Constants.CREATE_FILE_REQUEST_CODE && resultCode == RESULT_OK && data != null) {
//            Uri fileUri = data.getData();
//            if (fileUri != null) {
//                enqueueDownload(Uri.parse(fileUri.toString()));
//            }
//        }
//    }

    @Override
    public void onBackPressed() {
        if (this.webView.canGoBack()) {
            this.webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

//    // TODO: Find some way to download to any storage location with DownloadManager, since it doesn't take content:// URIs
//    private void enqueueDownload(Uri fileUri) {
//        DownloadDataHolder downloadDataHolder = DownloadDataHolder.getInstance();
//        FileUtils.startFileDownload(this,
//                downloadDataHolder.getDownloadUrl(),
//                downloadDataHolder.getContentDisposition(),
//                downloadDataHolder.getUserAgent(),
//                downloadDataHolder.getMimeType());
//    }

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
