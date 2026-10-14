package com.crolovac.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String DOMENA = "hunt-jade.vercel.app";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        otvoriPoveznicu(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        otvoriPoveznicu(intent);
    }

    /** Poveznica na CroLovac (npr. QR kod za dodavanje prijatelja) otvara se unutar aplikacije. */
    private void otvoriPoveznicu(Intent intent) {
        Uri uri = intent == null ? null : intent.getData();
        if (uri == null || bridge == null) return;
        if (!"https".equals(uri.getScheme()) || !DOMENA.equals(uri.getHost())) return;
        String adresa = uri.toString();
        bridge.getWebView().post(() -> bridge.getWebView().loadUrl(adresa));
    }
}
