export default {
  appId: 'com.taivas.rackt',    // must match your Android applicationId
  appName: 'RacktApp',          // your app’s display name
  webDir: '.next',
  bundledWebRuntime: false,
  ios: {
    config: {
      ITSAppUsesNonExemptEncryption: false
    }
  }
};
