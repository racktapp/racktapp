# Privacy & Consent

This application uses Google’s User Messaging Platform (UMP) to manage user consent for analytics and advertising.

## Testing the consent flow

1. Run a clean build in an emulator located in the EEA.
2. On first launch, analytics and ads are disabled until the UMP form is accepted.
3. Accepting enables Firebase Analytics and initializes AdMob.
4. Denying keeps analytics disabled and requests non‑personalized ads.
5. Reopen the form from **Settings > Privacy & Consent** to change your choice.

## Privacy policy

Replace the placeholder `https://rackt.app/privacy` URL with the real policy when available.
