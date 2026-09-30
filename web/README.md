# Fun with Flags — browser edition

A browser companion to the Android app: 48 flag cards, searchable countries and capitals, continent quizzes, score tracking, saved answer history, and downloadable text reports.

Built with React, Vinext, and Cloudflare D1. Hosted through Sites. Your saved results are scoped to your signed-in account. The latest 100 quizzes appear in the journal.

Flag assets: https://flagpedia.net / https://flagcdn.com (bundled locally for reliable Windows rendering).

Development: npm run dev
Production build: npm run build
Database migrations: npm run db:generate

Quiz progress is temporary until completion. Completed reports are saved server-side. If a save fails, keep the result screen open and use Retry save, or download the report.

The Android source is at https://github.com/shihabbk18/fun-with-flags.
