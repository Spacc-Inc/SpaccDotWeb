package org.eu.spacc.spaccdotweb.android;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public class FileUtils {

    public static void moveDirectory(File sourceLocation, File targetLocation, boolean deleteRoot) throws IOException {
        copyDirectory(sourceLocation, targetLocation);
        recursiveDelete(sourceLocation, deleteRoot);
    }

    /* https://subversivebytes.wordpress.com/2012/11/05/java-copy-directory-recursive-delete/ */

    public static void copyDirectory(File sourceLocation, File targetLocation) throws IOException {
        if (sourceLocation.isDirectory()) {
            if (!targetLocation.exists()) {
                targetLocation.mkdir();
            }
            String[] children = sourceLocation.list();
            for (int i = 0; i < children.length; i++) {
                copyDirectory(new File(sourceLocation, children[i]), new File(targetLocation, children[i]));
            }
        }
        else {
            InputStream in = new FileInputStream(sourceLocation);
            OutputStream out = new FileOutputStream(targetLocation);
            try {
                byte[] buf = new byte[1024];
                int len;
                while((len = in.read(buf)) > 0) {
                    out.write(buf, 0, len);
                }
            } finally {
                in.close();
                out.close();
            }
        }
    }

    public void recursiveDelete(File rootDir) {
        recursiveDelete(rootDir, true);
    }

    public static void recursiveDelete(File rootDir, boolean deleteRoot) {
        File[] childDirs = rootDir.listFiles();
        for (File childDir : childDirs) {
            if (childDir.isFile()) {
                childDir.delete();
            } else {
                recursiveDelete(childDir, deleteRoot);
                childDir.delete();
            }
        }
        if (deleteRoot) {
            rootDir.delete();
        }
    }
}
