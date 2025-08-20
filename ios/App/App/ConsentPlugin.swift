import Foundation
import Capacitor
import GoogleUserMessagingPlatform
import GoogleMobileAds

@objc(ConsentPlugin)
public class ConsentPlugin: CAPPlugin {
    var status: [String: String] = [
        "analytics": "denied",
        "ad_storage": "denied",
        "ad_personalization": "denied"
    ]

    public override func load() {
        if let saved = UserDefaults.standard.dictionary(forKey: "consent") as? [String: String] {
            status = saved
            initializeAdsIfNeeded()
        }
    }

    @objc public func getStatus(_ call: CAPPluginCall) {
        call.resolve(status)
    }

    @objc public func request(_ call: CAPPluginCall) {
        let params = UMPRequestParameters()
        params.tagForUnderAgeOfConsent = false
        UMPConsentInformation.sharedInstance.requestConsentInfoUpdate(with: params) { error in
            if error != nil {
                call.resolve(self.status)
                return
            }
            if UMPConsentInformation.sharedInstance.consentStatus == .required {
                UMPConsentForm.loadAndPresentIfRequired(from: self.bridge?.viewController) { loadError in
                    self.updateStatus()
                    self.initializeAdsIfNeeded()
                    call.resolve(self.status)
                }
            } else {
                self.updateStatus()
                self.initializeAdsIfNeeded()
                call.resolve(self.status)
            }
        }
    }

    func updateStatus() {
        let granted = UMPConsentInformation.sharedInstance.consentStatus == .obtained
        status["analytics"] = granted ? "granted" : "denied"
        status["ad_storage"] = granted ? "granted" : "denied"
        status["ad_personalization"] = granted ? "granted" : "denied"
        UserDefaults.standard.set(status, forKey: "consent")
    }

    func initializeAdsIfNeeded() {
        if status["ad_storage"] == "granted" {
            GADMobileAds.sharedInstance().start(completionHandler: nil)
        }
    }
}
