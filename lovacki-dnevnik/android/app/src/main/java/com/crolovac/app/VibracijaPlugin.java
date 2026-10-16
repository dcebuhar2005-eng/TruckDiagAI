package com.crolovac.app;

import android.content.Context;
import android.media.AudioAttributes;
import android.os.Build;
import android.os.VibrationAttributes;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import com.getcapacitor.JSArray;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.List;

/**
 * Vibracija po uzorku za alarm blizine (otkucaji srca). Ide kao alarm, pa radi i kad je
 * mobitel na tihom načinu i kad je zaslon ugašen, za razliku od navigator.vibrate u WebViewu.
 */
@CapacitorPlugin(name = "Vibracija")
public class VibracijaPlugin extends Plugin {

    /** vremena: [vibriraj, stani, vibriraj, stani, …] u milisekundama, kao navigator.vibrate. */
    @PluginMethod
    public void uzorak(PluginCall call) {
        Vibrator v = vibrator();
        JSArray niz = call.getArray("vremena");
        if (v == null || !v.hasVibrator() || niz == null) {
            call.resolve();
            return;
        }
        long[] t;
        try {
            List<Object> lista = niz.toList();
            t = new long[lista.size() + 1];
            for (int i = 0; i < lista.size(); i++) t[i + 1] = Math.max(0, ((Number) lista.get(i)).longValue());
        } catch (Exception e) {
            call.reject("Neispravan uzorak");
            return;
        }
        v.cancel();
        if (Build.VERSION.SDK_INT >= 33) {
            v.vibrate(VibrationEffect.createWaveform(t, -1), VibrationAttributes.createForUsage(VibrationAttributes.USAGE_ALARM));
        } else {
            AudioAttributes alarm = new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).build();
            if (Build.VERSION.SDK_INT >= 26) v.vibrate(VibrationEffect.createWaveform(t, -1), alarm);
            else v.vibrate(t, -1, alarm);
        }
        call.resolve();
    }

    @PluginMethod
    public void zaustavi(PluginCall call) {
        Vibrator v = vibrator();
        if (v != null) v.cancel();
        call.resolve();
    }

    private Vibrator vibrator() {
        Context c = getContext();
        if (Build.VERSION.SDK_INT >= 31) {
            VibratorManager m = (VibratorManager) c.getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
            return m == null ? null : m.getDefaultVibrator();
        }
        return (Vibrator) c.getSystemService(Context.VIBRATOR_SERVICE);
    }
}
