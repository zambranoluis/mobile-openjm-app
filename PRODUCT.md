# OpenJM native product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Stack

User-selected Expo SDK 57, React Native, TypeScript, Expo Router and npm. Android phones and iPhones are the initial targets. Private builds and staging precede any public-store work.

## Users and purpose

Existing OpenJM users need native access to their conversations, models, jobs and account on a phone, with the same authoritative product data used by the web client. Resume work across devices without submitting an ongoing response again.

## Capabilities and constraints

Conversations contains history, groups and new chat. Apps contains installed integrations and Obsidian workflows. Account contains profile/security, credits, hosted checkout, plans/subscriptions, usage/export, configuration and legal documents. Native screens adapt these operations to each OS. Registration/recovery, MFA and profile completion must preserve Spring's decisions. Model/media availability is authoritative and conditional; existing backend restrictions, including disabled voice operations, remain restrictions.

Processing is online. Account-isolated drafts remain local. Reopen reconciles server state. Shared replay, job recovery and opt-in completion/failure alerts are backend responsibilities. Payment return is pending until authoritative billing state confirms it. Notifications open an authenticated conversation/result, never bypass authorization.

Preserve available languages and approved OpenJM assets. Public stores, store billing and tablet-specific layouts are deferred. No current test result, account balance, price, throughput or integration claim may be invented. A capability matrix and execution records distinguish built functionality from remaining requirements; this document defines requirements, not a completion claim.

## Brand commitments

OpenJM identity and its hummingbird branding remain. Use direct, benefit-led product language and platform-native interaction. Keep secrets server-side and sensitive account data out of ordinary logs and retained captures.

## Accessibility and operating context

Support small phones, font scaling, screen readers, safe areas, keyboards, reduced motion, denied permissions, unstable networks and background/reopen recovery. Private releases require staging HTTPS, QA accounts, Android/iPhone devices, Expo/EAS access and Apple signing supplied through secure configuration.
