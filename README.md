# Fun with Flags ⚑

Developed by **Shihab**. Explore 250 countries, territories and other places in five geography games. Includes all 195 UN member/observer countries, with a countries-only filter.

## Play in your browser

**[Open Fun with Flags](https://shihabbk18.github.io/fun-with-flags/?v=3)** — no login, download, or emulator needed.

Scores are saved in this browser using IndexedDB. Clearing site data removes them. Download a text report to keep a separate copy.

## Download for Android

**[Download Fun with Flags APK](https://github.com/shihabbk18/fun-with-flags/releases/latest/download/Fun-with-Flags.apk)**

Android 8.0+ is supported. Download on your phone, then open the APK to install. This is a debug-signed testing build; Android may warn about installing from outside the Play Store. No GitHub login is needed.

[View releases](https://github.com/shihabbk18/fun-with-flags/releases).

## Five ways to play

- **Flag Finder:** identify countries from their flags.
- **Capital Quest:** choose a country's capital or administrative centre.
- **Continent Explorer:** find each country's continent.
- **60-second Sprint:** identify as many flags as you can before the clock runs out.
- **Flag Match:** match flag cards to country-name cards. Fewer turns is better.

Choose a region, include all 250 entries or only the 195-country set, and play 5, 10, 20, or 50 questions in ordinary quizzes. Matching uses up to six pairs. Missing capitals are excluded from capital games. Each correct answer or pair earns 10 points.

## Learn and track progress

Search the world atlas by country name, capital, or country code. Browser search also accepts alternative names and accent-free spelling. Results include game name, score, answer review, duration, and matching turns.

Android keeps its catalog and result history in SQLite. Upgrading the catalog from the original 48-entry app preserves existing saved results. In-progress games survive screen recreation and rotation. The Android and browser histories are separate.

## Accounts and cloud saving

Email sign-in, verification, sign-out, stay-signed-in sessions, recovery, and account-isolated cloud sync are implemented. **The Firebase project still needs to be connected before accounts can be activated.** Guest play and local scores remain available. See [CLOUD-SETUP.md](CLOUD-SETUP.md) for free-plan limits, setup, tests, and privacy details.

## Privacy and APK integrity

The published **2.0 APK** runs offline and requests **no permissions**: no internet, camera, microphone, contacts, location, or shared-storage access. It has no ads or analytics libraries. Sharing opens Android's chooser only when you tap Share. Guest browser scores stay on your device. The prepared account build adds network access for authentication and opt-in cloud sync, with no sensitive device permissions.

Release downloads include a SHA-256 checksum. It verifies that a download matches the published file; it is not a guarantee of absolute safety. Debug builds are for testing and have not undergone Play Store review. Keep Android's security protections enabled.

## Build and verify

Open this repository in Android Studio with JDK 17 and Android SDK 35.

    ./gradlew testDebugUnitTest lintDebug assembleDebug
    node browser-tests/smoke.cjs

On Windows, use gradlew.bat. The APK is written to app/build/outputs/apk/debug/app-debug.apk.

GitHub Actions verifies Android tests, lint, APK permissions, and its signature. The browser deployment checks JavaScript parsing, catalog coverage, game scoring, deadlines, matching rules, and old-history compatibility.

## Source and data

- app/: Java Android app, SQLite database, bundled country catalog.
- browser/: the public GitHub Pages app, local flag assets, and IndexedDB history.
- data/countries.json: shared canonical country dataset.
- tools/sync-country-data.cjs: regenerates Android and browser catalogs.
- web/: archived earlier ChatGPT-hosted prototype; the active website is browser/.

Country data attribution, licensing, and classification notes: [DATA-SOURCES.md](DATA-SOURCES.md). Names and capitals follow a reference snapshot, including multiple capitals and disputed entries.

Toolchain: Android Gradle Plugin 8.9.2, Gradle 8.11.1, Java 17, SDK 35, minimum SDK 26.
