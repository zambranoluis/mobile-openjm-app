# Private release prerequisites

User answered "i do not know" for staging HTTPS and device access on2026-10-08. No address, account, signing identity or Expo project is inferred. Independent local implementation continues.

| Requirement | Current evidence | Remaining owner action |
| --- | --- | --- |
| Staging mobile gateway HTTPS, protected Spring, PostgreSQL and Redis | Local gateway/Spring source and persistence checks; no hosted staging | Supply approved environment and deployment direction; run readiness and compatibility checks |
| Designated QA accounts and enabled upstream capabilities | Only deterministic fictional fixture accounts | Supply authorized QA access through secure configuration and verify ownership/quota/live capabilities |
| Expo/EAS project and authenticated build access | Project ID not configured; no private cloud build | Supply matching project and secure build access |
| Apple signing/provisioning, macOS/Xcode and iPhone access | No iOS installed run or signed artifact | Supply signing/access and registered testers; build/install and run all applicable journeys |
| Android phone and distribution signing | Android16/API36 x86_64 emulator/debug-signed fixture APKs only | Supply tester device/signing; build ARM APK for staging and install on the phone |
| Push credentials and physical delivery | Dispatch off; outbox/receipt/ownership/persistence checks | Configure provider securely, opt in on devices, verify delivery/receipt/logout/deep links |
| Web production build and shared replay cutover | Existing Windows UI/ui imports block production build; shared flag off | Resolve separate existing build blocker, observe old-producer drain/retention, then verify one live web/mobile response |
| Native acceptance | Selected Android fictional journeys only | Complete operation matrix, translations, both-platform accessibility/permissions/network/background/media checks |

After prerequisites are available, configure `EXPO_PUBLIC_MOBILE_API_URL` and `EAS_PROJECT_ID`, run all repository and boundary checks, then use the approved EAS staging profiles. `APP_ENV=staging` rejects an absent/insecure origin and fixture builds. Release signing and actual installation are separate from JavaScript exports.

Preserved APKs are listed in artifacts.json with hashes and input provenance. They are local emulator fixtures; they cannot be treated as Android phone or iOS distribution. Ignored artifacts/logs/captures require separate secure sharing when handing off outside this workspace. Public stores, store billing and tablets remain deferred. No Git publication or hosted deployment has been authorized.
