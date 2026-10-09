# Cookie Policy

> Version 1.1 · Effective September 1st, 2026

Published by **Open Jamaica AI Limited**.

## Scope

This policy covers the OpenJM API, the edge infrastructure that serves it, our
interactive API documentation page, and the storage the web chat interface uses in your
browser. Each is described below.

## Summary

**The OpenJM API sets no cookies.** Authentication uses bearer tokens sent in the
`Authorization` header, and refresh tokens travel in request bodies. There is no session
cookie.

**We run no analytics, no advertising and no tracking pixels on the API or the
infrastructure that serves it, and we use no third-party error-reporting service.**
Nothing we operate profiles you, follows you between sites, or builds an advertising
identity.

The items described below exist to deliver and secure the Service. All are strictly
necessary, and under ePrivacy Article 5(3) none requires consent.

## 1. Cookies set by the Service

None.

The API is consumed by programs rather than browsers, so a cookie would have nothing to
attach to.

## 2. Cookies set by our security provider

Our edge network and DDoS protection is provided by Cloudflare, which may set:

| Cookie         | Purpose                                                                            | Category           |
| -------------- | ---------------------------------------------------------------------------------- | ------------------ |
| `__cf_bm`      | Distinguishes automated traffic from people                                        | Strictly necessary |
| `cf_clearance` | Records that a security challenge was passed, so you are not challenged repeatedly | Strictly necessary |

We do not set these and cannot read their contents. They are security measures, not
analytics.

## 3. Local storage used by the web chat

The web chat stores a **conversation identifier** in your browser's `sessionStorage`, so
that a conversation can remember what you said earlier in it without requiring an
account.

- It is a random identifier and contains no personal data.
- It is discarded when you close the tab.
- The facts it refers to are held on our servers and expire after 2 hours.
- You can erase them immediately with `DELETE /v1/memory/session`.

ePrivacy Article 5(3) covers any storage on your device, not only cookies, which is why
this is disclosed here. It is exempt from consent because it exists solely to provide the
conversational memory you asked for by using the chat. It is not used for profiling or
measurement.

## 4. Third-party requests from the API documentation page

Our interactive API documentation page loads its rendering assets from the **jsDelivr**
content delivery network (`cdn.jsdelivr.net`). Requesting a file from a CDN discloses your
IP address and user-agent to its operator. jsDelivr sets no cookie for this, and no
identifier of ours travels with the request.

This affects the documentation page only. It does not apply to the API itself, and it does
not happen when your program calls the API.

## 5. Managing these items

Because we set no cookies of our own, there is nothing here to opt out of. Your browser
can block or delete the Cloudflare security cookies, though doing so may mean you are
challenged repeatedly or blocked, since the Service cannot then distinguish your traffic
from an attack. You can clear the chat's session storage by closing the tab, or erase the
underlying facts with the endpoint in Section 3.

## 6. Contact

Questions about this policy: dpo@openjm.ai.

**Open Jamaica AI Limited**, 53 Lady Musgrave Road, Kingston 8, Jamaica.
Company number 1377772.

## 7. Changes

Material changes are announced on the same terms as the Privacy Policy: registered users
are emailed at least 30 days before they take effect, and the revised policy is published
here for anyone using the chat without an account.
