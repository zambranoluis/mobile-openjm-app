# Security Policy and Vulnerability Disclosure

> Version 1.0 · Effective September 1st, 2026

Published by **Open Jamaica AI Limited**.

## 1. Reporting a vulnerability

Email **security@openjm.ai**. Include enough detail to reproduce the issue: the endpoint
or component, the steps, and what you observed. If you can, tell us the impact you think
it has.

We will acknowledge your report within **3 working days**, tell you our assessment within
**10 working days**, and keep you updated until it is resolved. We will tell you when a
fix ships, and we will credit you if you would like to be credited.

Please give us **90 days** before disclosing publicly, or longer if we agree it together.
If we cannot fix an issue in that time we will say so and explain why.

## 2. Safe harbour

If you follow this policy, we will treat your research as authorised. We will not pursue
civil action or report you to law enforcement for it, and we will say so if a third party
raises it.

Section 3.5 of the [Acceptable Use Policy](acceptable_use_policy.md) prohibits probing
our infrastructure "without authorization". **This policy is that authorization**, within
the limits in Section 3.

If you are unsure whether something is in scope, ask first at security@openjm.ai.

## 3. Rules of engagement

**In scope:** our public API endpoints, the account dashboard, the web chat, and the API
documentation page.

**Out of scope:** our sub-processors' own infrastructure (report those to Cloudflare,
Stripe, Mailgun, Backblaze or Brave directly), and anything belonging to another customer.

You must:

- test only against accounts and data you own — create your own test account;
- stop as soon as you have confirmed a vulnerability, and not pivot further;
- not access, modify, delete or retain another person's data. If you encounter personal
  data, stop, do not save it, and tell us what you saw so we can assess exposure;
- not degrade the Service — no denial of service, no load testing, no resource
  exhaustion, no spam;
- not use social engineering, phishing or physical attacks against our people; and
- not extort us. A report conditioned on payment is not a disclosure.

Sandbox escape research is welcome under these rules. Section 3.7 of the AUP prohibits
probing the execution sandbox; that prohibition does not apply to research conducted under
this policy against your own account.

## 4. Rewards

We do not currently run a paid bounty programme. We acknowledge reporters publicly with
their consent.

## 5. What we do on our side

Our current technical measures are summarised in Section 9 of the
[Privacy Policy](privacy_policy.md).

If a vulnerability results in a breach of personal data, we notify under Section 14 of
the Privacy Policy and Section 7 of the
[Data Processing Addendum](data_processing_addendum.md).

## 6. Contact

**security@openjm.ai** — vulnerability reports.
**abuse@openjm.ai** — misuse of the Service by another user.
**dpo@openjm.ai** — data protection.

**Open Jamaica AI Limited**, 53 Lady Musgrave Road, Kingston 8, Jamaica.
Company number 1377772.
