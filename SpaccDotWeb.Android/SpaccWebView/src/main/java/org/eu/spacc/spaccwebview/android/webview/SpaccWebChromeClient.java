package org.eu.spacc.spaccwebview.android.webview;

import android.annotation.TargetApi;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

import java.util.ArrayList;
import java.util.concurrent.atomic.AtomicBoolean;

import org.eu.spacc.spaccwebview.android.Config;
import org.eu.spacc.spaccwebview.android.Constants;
import org.eu.spacc.spaccwebview.android.SpaccWebViewActivity;
import org.eu.spacc.spaccwebview.android.utils.ApiUtils;

public class SpaccWebChromeClient extends WebChromeClient {
    private final SpaccWebViewActivity activity;
    private Config config;

    public SpaccWebChromeClient(SpaccWebViewActivity activity) {
        super();
        this.activity = activity;
    }

    public void applyConfig(Config config) {
        this.config = config;
    }

    // TODO: Android < 4 support

    @TargetApi(Build.VERSION_CODES.LOLLIPOP)
    @Override
    public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> valueCallback, FileChooserParams fileChooserParams) {
        activity.filesUploadCallback = valueCallback;
        activity.startActivityForResult(fileChooserParams.createIntent(), Constants.ActivityCodes.UPLOAD_FILE.ordinal());
        return true;
    }

    //@Override // Android 4.1+
    protected void openFileChooser(ValueCallback<Uri> valueCallback, String acceptType, String capture) {
        Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        activity.fileUploadCallback = valueCallback;
        activity.startActivityForResult(Intent.createChooser(intent, null), Constants.ActivityCodes.UPLOAD_FILE.ordinal());
    }

    @Override
    public void onPermissionRequest(PermissionRequest request) {
        AtomicBoolean handled = new AtomicBoolean(false);
        ApiUtils.apiRun(21, () -> {
            ArrayList<String> granted = new ArrayList<>();
            for (String resource: request.getResources()) {
                if ((resource.equals(PermissionRequest.RESOURCE_PROTECTED_MEDIA_ID) && config.getAllowDrmMedia()) ||
                    (resource.equals(PermissionRequest.RESOURCE_AUDIO_CAPTURE) && config.getAllowAudioCapture()) ||
                    (resource.equals(PermissionRequest.RESOURCE_VIDEO_CAPTURE) && config.getAllowVideoCapture())
                ) {
                    granted.add(resource);
                }
            }
            if (!granted.isEmpty()) {
                request.grant(granted.toArray(new String[0]));
                handled.set(true);
            }
        });
        if (!handled.get()) {
            super.onPermissionRequest(request);
        }
    }
}
