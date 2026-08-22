# ProGuard/R8 rules for the release build.
#
# minifyEnabled is still false in build.gradle. These rules are staged so that
# turning it on is a one-line change rather than a debugging session — see
# docs/android-release-build.md before flipping it.
#
# The recurring hazard in a Capacitor app is reflection: the bridge resolves
# plugins and their methods by name at runtime, so R8 sees no caller and
# strips them. Nothing fails at build time; the app just loses a feature.

# Keep line numbers so Play Console crash reports stay readable, but drop the
# original source file names.
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Annotations drive the whole Capacitor bridge — losing them silently unbinds
# every plugin method.
-keepattributes *Annotation*, Signature, Exceptions, InnerClasses

# Capacitor bridge and every plugin it resolves by name.
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keep class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.PluginMethod <methods>;
}

# This app's own plugins, both named explicitly in MainActivity.registerPlugin.
-keep class com.macrotrackr.app.PlayBillingPlugin { *; }
-keep class com.codetrixstudio.capacitor.GoogleAuth.** { *; }

# Cordova plugins bridged through capacitor-cordova-android-plugins are
# instantiated from a generated name list, so they have no static caller.
-keep class org.apache.cordova.** { *; }
-keep public class * extends org.apache.cordova.CordovaPlugin

# Anything reachable from JavaScript through the WebView bridge.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Play Billing ships its own consumer rules, but the listener interfaces are
# implemented as lambdas here and R8 has been known to strip their bridges.
-keep class com.android.billingclient.api.** { *; }

# Kotlin/coroutines metadata used by AndroidX libraries pulled in transitively.
-keepclassmembers class kotlinx.coroutines.** { volatile <fields>; }
-dontwarn kotlinx.coroutines.**
