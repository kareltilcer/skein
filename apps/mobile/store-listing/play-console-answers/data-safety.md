# Data safety form — recommended answers

Play Console ▸ App content ▸ **Data safety**

**Summary:** YarnLog is fully on-device. All projects, the custom library, custom
stitches and preferences are stored locally via `AsyncStorage`. There is no backend,
no account system, no analytics, and no third-party SDKs. Nothing the user creates or
does leaves the device. Google defines "collection" as data transmitted off the device —
because YarnLog transmits nothing, the correct declaration is **no data collected or shared**.

Verified in-repo: `android.permissions: []` in `app.json`; storage is `@react-native-async-storage`
only; no network/analytics/crash-reporting libraries are wired in.

---

## Data collection and security

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **No** |

Selecting **No** ends the data-type questionnaire. The remaining questions below only
appear if you answer **Yes**, but they are documented here in case the form asks:

| Question | Answer / note |
|---|---|
| Is all of the user data collected by your app encrypted in transit? | N/A — no data is collected or transmitted. |
| Do you provide a way for users to request that their data is deleted? | N/A — data is local; uninstalling the app removes it. (An in-app "reset all data" flow also exists in the codebase.) |

## Data types — declare NONE of these

Confirm every category is left **unchecked**:

- Location (approximate, precise) — **none**
- Personal info (name, email, address, phone, IDs, other) — **none**
- Financial info — **none**
- Health & fitness — **none**
- Messages (emails, SMS, in-app) — **none**
- Photos & videos — **none**
- Audio — **none**
- Files & docs — **none**
- Calendar / Contacts — **none**
- App activity (interactions, search history, installed apps, other) — **none**
- Web browsing history — **none**
- App info & performance (crash logs, diagnostics) — **none** (no crash reporting is integrated)
- Device or other IDs — **none**

## Privacy policy

- Privacy policy URL (also required on the main store listing):

      https://yarnlog.tilcer.cz/privacy-policy

## Notes / edge cases

- **"Tell a friend" share:** Settings has an optional share action that opens the OS share
  sheet with a fixed promotional message ("I've been using YarnLog…"). It sends no user data
  and only shares text the user explicitly chooses to send. It does **not** count as data
  collection or sharing.
- **INTERNET permission:** even if the platform includes a default INTERNET permission, the app
  makes no network requests, so no data is collected or shared. The declaration above is unaffected.
- Google occasionally rewords these questions — match the intent ("nothing leaves the device"),
  not the exact strings, if the wording differs.
