# OpenJM native product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Stack

User-selected Expo SDK 57, React Native, TypeScript, Expo Router and npm. Android phones and iPhones are the initial targets. Private builds and staging precede any public-store work.

## Users and purpose

Existing OpenJM users need native access to their conversations, models, jobs and account on a phone, with the same authoritative product data used by the web client. Resume work across devices without submitting an ongoing response again.

## Capabilities and constraints

Authenticated entry opens conversation history unless an authorized deep link or account-scoped restored conversation takes precedence. A branded mobile header and drawer replace the visible tab shell, preserving the web's principal destinations and profile/configuration hierarchy. History contains groups and new chat; jobs and embeddings remain secondary destinations. Apps contains installed integrations and Obsidian workflows. Profile contains personal/security, separate credits and billing, hosted checkout, plans/subscriptions and usage/reports. Configuration contains memories/preferences/tools, domains and API keys. Legal, languages and completion alerts remain accessible. Native screens adapt these operations to each OS. Registration/recovery, MFA and profile completion must preserve Spring's decisions. Model/media availability is authoritative and conditional; existing backend restrictions, including disabled voice operations and video generation, remain restrictions.

Processing is online. Account-isolated drafts remain local. Reopen reconciles server state. Shared replay, job recovery and opt-in completion/failure alerts are backend responsibilities. Payment return is pending until authoritative billing state confirms it. Notifications open an authenticated conversation/result, never bypass authorization.

Conversation details preserve supplied thinking/answers/references/context/attachments/results and work state. Usage preserves supplied summary/chart/history/detail/report values, units and missing/partial/stale distinctions. One intentional new-chat send creates the conversation and submits with a stable persisted identity; uncertain execution is reconciled without blind retry. Camera/QR access follows an explicit user action; decoded gift codes require review and a separate redemption action. Clipboard, date controls, files, downloads and sharing use native adapters. QR scanning and playback animation require no microphone permission.

Preserve available languages and approved OpenJM assets. Public stores, store billing and tablet-specific layouts are deferred. No current test result, account balance, price, throughput or integration claim may be invented. A capability matrix and execution records distinguish built functionality from remaining requirements; this document defines requirements, not a completion claim.

## Brand commitments

OpenJM identity and its hummingbird branding remain. Use direct, benefit-led product language and platform-native interaction. Keep secrets server-side and sensitive account data out of ordinary logs and retained captures.

## Accessibility and operating context

Support small phones, font scaling, screen readers, safe areas, keyboards, reduced motion, denied permissions, unstable networks and background/reopen recovery. Private releases require staging HTTPS, QA accounts, Android/iPhone devices, Expo/EAS access and Apple signing supplied through secure configuration.
