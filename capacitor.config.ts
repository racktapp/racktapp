export default {
  appId: 'com.taivas.rackt',    // must match your Android applicationId
  appName: 'RacktApp',          // your app’s display name
  webDir: 'out',                // where `next export` puts the static files
  bundledWebRuntime: false,
  ios: {
    config: {
      ITSAppUsesNonExemptEncryption: false
    }
  }
};
