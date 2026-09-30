# Fun with Flags ⚑

A native Android learning and quiz app built with Java and SQLite. Explore 48 countries across six continents, test your flag knowledge, and keep a personal travel journal of your results.

## Features
- Offline flag library with country names, capitals, continent filters, and search.
- World or continent quizzes with 5, 10, or 20 questions, capped to the available countries.
- Four unique options, randomized questions, instant feedback, and 10 points per correct answer.
- Detailed answer review, accuracy, elapsed time, and Android share-sheet reports.
- SQLite-backed country catalog and persistent quiz history with lifetime statistics.
- In-progress question and answer state survives activity recreation, including rotation.
- Cream, forest-green, and golden-yellow native interface; no ads, accounts, tracking, or network permission.

## Build and run
Open this folder in Android Studio with JDK 17 and Android SDK 35. Let Gradle sync, then run the app configuration on an Android 8.0+ device or emulator.

    ./gradlew testDebugUnitTest lintDebug assembleDebug

Windows: use gradlew.bat instead. The debug APK is written to app/build/outputs/apk/debug/app-debug.apk.

Every push to main runs the same verification in GitHub Actions. Download **fun-with-flags-debug-apk** from a successful **Android build** run, unzip it, and install the APK on your Android device. This is a debug-signed build for testing; Play Store distribution requires your own release signing configuration.

## Structure
- MainActivity.java: native screens, navigation, learning library, quiz feedback, reports.
- Quiz.java: platform-independent randomized quiz engine and serializable state.
- FlagDatabase.java: SQLite catalog, parameterized search, results, and statistics.
- Country.java: country model and Unicode flag conversion.
- app/src/test: quiz correctness and state-restoration tests.

## Data and privacy
All data stays on the device. Sharing a report is optional and opens Android's chooser. Completed results persist until app data is cleared or the app is uninstalled; an unfinished quiz is not a saved result. The catalog is a curated educational subset, not an exhaustive list of countries. Capitals include seats of government where appropriate (for example, Bern). Flags are rendered using Android's system emoji font, so appearance can vary by device. No third-party flag image downloads are required.

## Toolchain
Android Gradle Plugin 8.9.2, Gradle 8.11.1, Java 17, compile/target SDK 35, minimum SDK 26.
Compatibility: https://developer.android.com/build/releases/past-releases/agp-8-9-0-release-notes
