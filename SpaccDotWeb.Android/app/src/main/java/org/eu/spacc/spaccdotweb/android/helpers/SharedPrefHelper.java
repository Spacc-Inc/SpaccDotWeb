package org.eu.spacc.spaccdotweb.android.helpers;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Build;

public class SharedPrefHelper {
    private final SharedPreferences sharedPref;

    public SharedPrefHelper(Context context) {
        this.sharedPref = context.getSharedPreferences("SpaccWebView", Context.MODE_PRIVATE);
    }

    public Integer getInt(String name) {
        Integer value = (Integer)sharedPref.getInt(name, -1);
        return (value != -1 ? value : null);
    }

    public void setInt(String name, int value) {
        SharedPreferences.Editor editor = sharedPref.edit().putInt(name, value);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.GINGERBREAD) {
            editor.apply();
        } else {
            editor.commit();
        }
    }
}
