package com.example.spaccwebviewapplication;

import android.os.Bundle;

import org.eu.spacc.spaccdotweb.android.helpers.DataMoveHelper;
import org.eu.spacc.spaccdotweb.android.SpaccWebViewActivity;

public class MainActivity extends SpaccWebViewActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        DataMoveHelper.run(this, R.string.exit, R.string.move_app_data, R.string.move_app_data_info);

        this.webView = findViewById(R.id.webview);
        this.webView.loadAppIndex();
    }
}
