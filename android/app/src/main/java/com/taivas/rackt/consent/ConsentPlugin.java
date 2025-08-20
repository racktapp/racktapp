package com.taivas.rackt.consent;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.PluginMethod;

import com.google.android.gms.ads.MobileAds;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;

@CapacitorPlugin(name = "Consent")
public class ConsentPlugin extends Plugin {
    private SharedPreferences prefs;
    private ConsentInformation consentInformation;

    @Override
    public void load() {
        Context context = getContext();
        prefs = context.getSharedPreferences("consent", Context.MODE_PRIVATE);
        consentInformation = UserMessagingPlatform.getConsentInformation(context);
        // Initialize ads if consent was previously granted
        if ("granted".equals(prefs.getString("ad_storage", "denied"))) {
            MobileAds.initialize(context);
        }
    }

    private JSObject currentStatus() {
        JSObject res = new JSObject();
        res.put("analytics", prefs.getString("analytics", "denied"));
        res.put("ad_storage", prefs.getString("ad_storage", "denied"));
        res.put("ad_personalization", prefs.getString("ad_personalization", "denied"));
        return res;
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        call.resolve(currentStatus());
    }

    @PluginMethod
    public void request(PluginCall call) {
        ConsentRequestParameters params = new ConsentRequestParameters.Builder().build();
        consentInformation.requestConsentInfoUpdate(
                getActivity(),
                params,
                () -> {
                    if (consentInformation.getConsentStatus() == ConsentInformation.ConsentStatus.REQUIRED) {
                        loadAndShowForm(call);
                    } else {
                        updateStatus(call);
                    }
                },
                formError -> updateStatus(call)
        );
    }

    private void loadAndShowForm(PluginCall call) {
        UserMessagingPlatform.loadAndShowConsentFormIfRequired(
                getActivity(),
                formError -> updateStatus(call)
        );
    }

    private void updateStatus(PluginCall call) {
        boolean granted = consentInformation.getConsentStatus() == ConsentInformation.ConsentStatus.OBTAINED;
        prefs.edit()
                .putString("analytics", granted ? "granted" : "denied")
                .putString("ad_storage", granted ? "granted" : "denied")
                .putString("ad_personalization", granted ? "granted" : "denied")
                .apply();
        if (granted) {
            MobileAds.initialize(getContext());
        }
        call.resolve(currentStatus());
    }
}
