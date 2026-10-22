package com.macrotrackr.app;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    // Android 15+ forces edge-to-edge; opting in makes older versions match.
    EdgeToEdge.enable(this);
    // super.onCreate builds the bridge, so a plugin registered after it never loads.
    registerPlugin(PlayBillingPlugin.class);
    super.onCreate(savedInstanceState);
  }
}
