package com.macrotrackr.app;

import android.app.Activity;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Google Play Billing for subscriptions.
 *
 * Deliberately thin. It opens the purchase sheet and reports purchase tokens
 * back to the web layer, and that is all. It never decides entitlement and it
 * never acknowledges a purchase: the server does both, because a client can be
 * patched and Google's answer is the only one worth trusting.
 *
 * The JS side is frontend/src/services/native/playBilling.ts. The plugin name
 * below has to keep matching the registerPlugin call there.
 */
@CapacitorPlugin(name = "PlayBilling")
public class PlayBillingPlugin extends Plugin {

  private BillingClient billingClient;

  /**
   * The purchase() call waiting on Play's sheet. Play reports the result
   * through a listener rather than a return value, so the call has to be
   * parked here until it arrives.
   */
  @Nullable
  private PluginCall pendingPurchaseCall;

  private final PurchasesUpdatedListener purchasesUpdatedListener =
    new PurchasesUpdatedListener() {
      @Override
      public void onPurchasesUpdated(
        @NonNull BillingResult billingResult,
        @Nullable List<Purchase> purchases
      ) {
        PluginCall call = pendingPurchaseCall;
        if (call == null) {
          // Play also reports purchases made outside this flow, for instance
          // one that completed while the app was closed. getPurchases()
          // picks those up, so there is nothing to resolve here.
          return;
        }
        pendingPurchaseCall = null;

        int responseCode = billingResult.getResponseCode();

        if (responseCode == BillingClient.BillingResponseCode.USER_CANCELED) {
          JSObject result = new JSObject();
          result.put("purchaseToken", null);
          result.put("userCancelled", true);
          call.resolve(result);
          return;
        }

        if (responseCode != BillingClient.BillingResponseCode.OK) {
          call.reject(
            "Purchase failed: " + billingResult.getDebugMessage(),
            String.valueOf(responseCode)
          );
          return;
        }

        String purchaseToken = firstPurchaseToken(purchases);

        JSObject result = new JSObject();
        result.put("purchaseToken", purchaseToken);
        result.put("userCancelled", false);
        call.resolve(result);
      }
    };

  @Nullable
  private static String firstPurchaseToken(@Nullable List<Purchase> purchases) {
    if (purchases == null) {
      return null;
    }
    for (Purchase purchase : purchases) {
      String token = purchase.getPurchaseToken();
      if (token != null && !token.isEmpty()) {
        return token;
      }
    }
    return null;
  }

  @Override
  public void load() {
    // enablePendingPurchases is required for subscriptions. Without it the
    // client throws as soon as a purchase flow starts.
    billingClient = BillingClient
      .newBuilder(getContext())
      .setListener(purchasesUpdatedListener)
      .enablePendingPurchases(
        PendingPurchasesParams.newBuilder().enableOneTimeProducts().build()
      )
      .build();
  }

  @Override
  protected void handleOnDestroy() {
    // Don't leave the JS promise hanging if the activity dies mid-sheet.
    if (pendingPurchaseCall != null) {
      pendingPurchaseCall.reject("Purchase flow cancelled: activity destroyed");
      pendingPurchaseCall = null;
    }
    if (billingClient != null) {
      billingClient.endConnection();
      billingClient = null;
    }
    super.handleOnDestroy();
  }

  /** Run work once the billing client is connected, reconnecting if needed. */
  private void withConnection(PluginCall call, Runnable work) {
    if (billingClient == null) {
      call.reject("Billing is not available on this device");
      return;
    }

    if (billingClient.isReady()) {
      work.run();
      return;
    }

    billingClient.startConnection(
      new BillingClientStateListener() {
        @Override
        public void onBillingSetupFinished(@NonNull BillingResult billingResult) {
          if (
            billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK
          ) {
            call.reject(
              "Could not connect to Google Play: " + billingResult.getDebugMessage(),
              String.valueOf(billingResult.getResponseCode())
            );
            return;
          }
          work.run();
        }

        @Override
        public void onBillingServiceDisconnected() {
          // Left to the next call to reconnect. Rejecting here would fire
          // after a successful purchase on a flaky connection.
        }
      }
    );
  }

  @PluginMethod
  public void purchase(PluginCall call) {
    String productId = call.getString("productId");
    if (productId == null || productId.isEmpty()) {
      call.reject("productId is required");
      return;
    }

    if (pendingPurchaseCall != null) {
      call.reject("A purchase is already in progress");
      return;
    }

    String basePlanId = call.getString("basePlanId");
    String obfuscatedAccountId = call.getString("obfuscatedAccountId");

    withConnection(
      call,
      () -> queryThenLaunch(call, productId, basePlanId, obfuscatedAccountId)
    );
  }

  private void queryThenLaunch(
    PluginCall call,
    String productId,
    @Nullable String basePlanId,
    @Nullable String obfuscatedAccountId
  ) {
    QueryProductDetailsParams params = QueryProductDetailsParams
      .newBuilder()
      .setProductList(
        Collections.singletonList(
          QueryProductDetailsParams.Product
            .newBuilder()
            .setProductId(productId)
            .setProductType(BillingClient.ProductType.SUBS)
            .build()
        )
      )
      .build();

    billingClient.queryProductDetailsAsync(
      params,
      (billingResult, productDetailsResult) -> {
        if (
          billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK
        ) {
          call.reject(
            "Could not load the subscription: " + billingResult.getDebugMessage(),
            String.valueOf(billingResult.getResponseCode())
          );
          return;
        }

        List<ProductDetails> productDetailsList =
          productDetailsResult.getProductDetailsList();

        if (productDetailsList == null || productDetailsList.isEmpty()) {
          // Almost always a configuration problem rather than a device one:
          // the product is not active in the Play Console, or this build is
          // not from a track that can see it.
          call.reject("Subscription " + productId + " is not available");
          return;
        }

        ProductDetails productDetails = productDetailsList.get(0);
        String offerToken = resolveOfferToken(productDetails, basePlanId);

        if (offerToken == null) {
          call.reject("Subscription " + productId + " has no purchasable offer");
          return;
        }

        launch(call, productDetails, offerToken, obfuscatedAccountId);
      }
    );
  }

  /**
   * Pick the offer to buy. With a basePlanId, take that plan's offer, which is
   * what makes monthly and yearly selectable from one product. Without one,
   * take the first offer Play returns.
   */
  @Nullable
  private static String resolveOfferToken(
    ProductDetails productDetails,
    @Nullable String basePlanId
  ) {
    List<ProductDetails.SubscriptionOfferDetails> offers =
      productDetails.getSubscriptionOfferDetails();

    if (offers == null || offers.isEmpty()) {
      return null;
    }

    if (basePlanId != null && !basePlanId.isEmpty()) {
      for (ProductDetails.SubscriptionOfferDetails offer : offers) {
        if (basePlanId.equals(offer.getBasePlanId())) {
          return offer.getOfferToken();
        }
      }
    }

    return offers.get(0).getOfferToken();
  }

  private void launch(
    PluginCall call,
    ProductDetails productDetails,
    String offerToken,
    @Nullable String obfuscatedAccountId
  ) {
    Activity activity = getActivity();
    if (activity == null) {
      call.reject("No activity to show the purchase sheet in");
      return;
    }

    BillingFlowParams.Builder flowBuilder = BillingFlowParams
      .newBuilder()
      .setProductDetailsParamsList(
        Collections.singletonList(
          BillingFlowParams.ProductDetailsParams
            .newBuilder()
            .setProductDetails(productDetails)
            .setOfferToken(offerToken)
            .build()
        )
      );

    // Play echoes this back on every notification about the purchase, which is
    // how the server matches a renewal or cancellation to an account even if
    // the app never managed to report the purchase. It is an opaque random
    // token, never an email or a user id.
    if (obfuscatedAccountId != null && !obfuscatedAccountId.isEmpty()) {
      flowBuilder.setObfuscatedAccountId(obfuscatedAccountId);
    }

    BillingFlowParams flowParams = flowBuilder.build();

    // Park the call before launching. The listener can fire before
    // launchBillingFlow returns, and an unset field there loses the result.
    pendingPurchaseCall = call;
    call.setKeepAlive(true);

    // @PluginMethod runs on a bridge worker thread; Play requires the flow
    // to be launched from the main thread.
    final Activity pluginActivity = activity;
    final BillingFlowParams params = flowParams;
    getBridge()
      .getActivity()
      .runOnUiThread(() -> {
        BillingResult result = billingClient.launchBillingFlow(
          pluginActivity,
          params
        );

        if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
          pendingPurchaseCall = null;
          call.reject(
            "Could not open the purchase sheet: " + result.getDebugMessage(),
            String.valueOf(result.getResponseCode())
          );
        }
      });
  }

  /**
   * Subscriptions Play is holding for this user. Used to recover a purchase
   * that was paid for but never reached our server, after a reinstall or a
   * failed verify call.
   */
  @PluginMethod
  public void getPurchases(PluginCall call) {
    withConnection(
      call,
      () ->
        billingClient.queryPurchasesAsync(
          QueryPurchasesParams
            .newBuilder()
            .setProductType(BillingClient.ProductType.SUBS)
            .build(),
          (billingResult, purchases) -> {
            if (
              billingResult.getResponseCode() !=
              BillingClient.BillingResponseCode.OK
            ) {
              call.reject(
                "Could not read purchases: " + billingResult.getDebugMessage(),
                String.valueOf(billingResult.getResponseCode())
              );
              return;
            }

            List<String> tokens = new ArrayList<>();
            for (Purchase purchase : purchases) {
              // PENDING purchases have not been paid for yet, so sending them
              // to the server would only produce a token worth nothing.
              if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                tokens.add(purchase.getPurchaseToken());
              }
            }

            JSObject result = new JSObject();
            result.put("purchaseTokens", JSArray.from(tokens.toArray()));
            call.resolve(result);
          }
        )
    );
  }
}
