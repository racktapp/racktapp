# Add project specific ProGuard rules here.
# By default, the flags in this file are applied to all build types.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html
-keep class com.getcapacitor.** { *; }
-keep class * extends java.util.ListResourceBundle {
    protected Object[][] getContents();
}
-keepattributes *Annotation*
