# Private accounts and cloud saving

Implemented for the browser and Android using Firebase Authentication and Cloud Firestore. Firebase is not connected to this repository yet. The included cloud-config.json files have enabled=false; guest play remains functional. Do not describe account creation or cloud saving as live until the owner connects a project and the activation checks below pass.

## Cost

Firebase Spark is the no-payment-method plan. Email/password authentication is included. Firestore Standard currently includes 1 GiB storage, 50,000 document reads/day and 20,000 writes/day; quotas apply. Email verification and password-reset messages also have daily limits. No SMS, paid functions, file storage, analytics, or billing upgrade is required by this implementation.

Pricing: https://firebase.google.com/pricing
Auth limits: https://firebase.google.com/docs/auth/limits

Do not promise unlimited usage or permanent availability. Quotas, account access, and provider availability can interrupt sync. Keep downloadable reports as an independent copy. The game remains playable offline.

## Account behavior

- Email/password signup; minimum 12 characters in the app. Enforce that policy on the Firebase project too.
- Email verification is required by server rules before reading or writing cloud results.
- Stay-signed-in checkbox: persistent trusted-device sessions on the web; on Android, unchecking signs out when the app process starts again.
- Sign out at any time. Synced local account cache is cleared; unsent results remain under that account to avoid destroying offline progress. They are not shown to guests or other accounts.
- Forgot-password email and verification resend/check actions.
- Local result queues separated by user ID; old results without an owner remain guest results.
- Guest import requires an explicit action and confirmation. Shared-device scores are never automatically claimed.
- Automatic sync on a completed game, sign-in, app resume, and restored network access. Failed sync leaves completed results local and offers retry.
- Shared result schema allows browser and Android history to appear in the same account. Legacy Android results retain text reports even when their original answer arrays are unavailable.
- Passwords are sent to Firebase Auth only; the app does not log or store them. Firebase SDKs handle auth sessions and refresh.
- Results are personal history, not a cheat-proof competitive leaderboard. The rules bound scores and payloads but do not replay answers on a trusted game server.

## Activate on a project you own

Use the official Firebase plugin after installing and connecting it, or use the Firebase console. Keep the project on Spark. Do not enable analytics or connect a billing account.

1. Create/select a Firebase project and register both apps:
   - Web app for https://shihabbk18.github.io/fun-with-flags/.
   - Android app package com.shihab.funwithflags.
2. Enable Authentication > Email/Password. Set minimum password length to 12, enable email enumeration protection, and authorize shihabbk18.github.io as an auth domain.
3. Create one Firestore Standard database in production mode, in an appropriate nearby region. Deploy cloud/firestore.rules before enabling the clients. Never use allow read, write: if true.
4. Obtain the public configuration objects for both registered apps. Use cloud/public-config.example.json as the shape. These are public client settings, not service-account credentials.
5. From the repository root, run:
   
       node cloud/set-config.mjs PATH_TO_PUBLIC_APP_SETTINGS.json

   Never paste a private key, admin credential, or service-account JSON into this file or a client bundle.
6. Authenticate the Firebase CLI through your own account and deploy rules from cloud/:

       firebase deploy --only firestore:rules --project YOUR_PROJECT_ID

7. Build, verify, publish the website, and rebuild the APK. Firebase setup alone does not update the APK's bundled config.

The configuration tool requires web and Android app IDs for the same project and refuses unknown fields to reduce accidental secret exposure.

## Verify before releasing accounts

    node browser-tests/smoke.cjs
    npm ci --prefix cloud
    npm run build --prefix cloud
    npm test --prefix cloud
    npm run test:rules --prefix cloud
    ./gradlew testDebugUnitTest lintDebug assembleDebug

Rules tests run against a local demo emulator; they do not create a paid cloud project. They verify owner isolation, anonymous/unverified denial, immutable results, score bounds, size bounds, and extra-field denial.

On the actual configured service, use two disposable test accounts to verify email delivery, verification, sign-in, persistent sessions, sign-out, password reset, offline queueing, cross-device sync, and denial of cross-account access. Emulator checks cannot confirm production email delivery or project configuration.

## Privacy and security

Firestore data lives at users/{verified-user-id}/results/{result-id}. Rules deny every other path. Emails are handled by Firebase Authentication and are not included in score documents. Each record is at most a bounded report and serialized game summary. Browser cloud SDK data uses its default memory cache; Android explicitly uses a memory Firestore cache, alongside account-scoped SQLite queues.

Signed-out account data that has not reached the cloud remains locally stored and is hidden by app access controls. A person with physical access to a debug device/browser developer tools can inspect local storage. Avoid stay-signed-in on shared devices. This testing APK is not Play Store reviewed; production distribution should use a stable private signing key, a non-debug build, and a privacy notice.

The Android account build needs normal internet/network-state permissions for syncing. The 2.0 offline APK stays unchanged until a configured account build is explicitly released. No camera, microphone, contacts, location, or shared-storage permissions are added.
