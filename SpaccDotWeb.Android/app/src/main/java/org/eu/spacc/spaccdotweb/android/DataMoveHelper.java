package org.eu.spacc.spaccdotweb.android;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.os.Build;
import java.io.IOException;

public class DataMoveHelper {

    public static void run(Context context, int labelExit, int dialogTitle, int dialogMessage) {
        Activity activity = (Activity)context;
        SharedPrefHelper sharedPrefHelper = new SharedPrefHelper(context);
        Constants.DataLocation dataLocationReal = (StorageUtils.isInstalledOnExternalStorage(context) ? Constants.DataLocation.EXTERNAL : Constants.DataLocation.INTERNAL);
        Integer dataLocationSaved = sharedPrefHelper.getInt("data_location");
        if (dataLocationSaved == null) {
            sharedPrefHelper.setInt("data_location", dataLocationReal.ordinal());
        } else if (!dataLocationSaved.equals(dataLocationReal.ordinal())) {
            new AlertDialog.Builder(context)
                    .setTitle(dialogTitle)
                    .setMessage(dialogMessage)
                    .setCancelable(false)
                    .setNegativeButton(labelExit, new DialogInterface.OnClickListener() {
                        @Override
                        public void onClick(DialogInterface dialogInterface, int i) {
                            ((Activity)context).finish();
                        }
                    })
                    .setPositiveButton(android.R.string.ok, new DialogInterface.OnClickListener() {
                        @Override
                        public void onClick(DialogInterface dialogInterface, int i) {
                            // TODO: Check that the storage locations are all present to copy, and implement an error dialog
                            try {
                                FileUtils.moveDirectory(StorageUtils.dataDirFromEnum(context, Constants.DataLocation.values()[dataLocationSaved]), StorageUtils.dataDirFromEnum(context, dataLocationReal), false);
                            } catch (IOException e) {
                                throw new RuntimeException(e);
                            }
                            sharedPrefHelper.setInt("data_location", dataLocationReal.ordinal());
                            restartActivity(context);
                        }
                    })
                    .show();
        }
    }

    private static void restartActivity(Context context) {
        Activity activity = (Activity)context;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB) {
            activity.recreate();
        } else {
            Intent intent = activity.getIntent();
            activity.finish();
            context.startActivity(intent);
        }
    }
}
