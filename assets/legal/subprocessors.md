# Processors and Sub-processors

> Version 1.1 · Effective September 1st, 2026

**Open Jamaica AI Limited** operates OpenJM. The organisations below process personal
data on our behalf. This page is the authoritative list; the
[Privacy Policy](privacy_policy.md) summarises it.

**Which term applies depends on our role.** Where we are the controller — your account,
billing, technical and abuse data, and content you submit as an individual — these
organisations are our **processors**. Where we are your processor under the
[Data Processing Addendum](data_processing_addendum.md), because you have submitted other
people's personal data in the course of a business, they are our **sub-processors** and
yours. The list is the same either way.

**Inference runs on our own hardware in Kingston, Jamaica.** Your prompts and the
model's responses are not sent to any third-party model provider — there is no hosted
inference vendor in this list, because there is none in the Service.

## Current list

| Organisation             | Purpose                                                     | Personal data received                                                                                                                                 | Location               |
| ------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| **Cloudflare, Inc.**     | Edge network, TLS termination, DDoS and firewall protection | Request and response traffic in transit: IP address, user-agent, URLs, headers, and message bodies                                                     | Global edge            |
| **Stripe, Inc.**         | Payments and subscriptions                                  | Email address, amounts, subscription, payment-intent and charge identifiers. Card details pass from your browser directly to Stripe and never reach us | United States, Ireland |
| **Mailgun (Sinch)**      | Transactional email                                         | Recipient email address and the full contents of the message, including password-reset links                                                           | United States          |
| **Backblaze, Inc. (B2)** | Encrypted off-site backups                                  | Database backups, transaction logs and log archives, **encrypted before they leave our infrastructure**, so Backblaze holds ciphertext only            | United States          |
| **Brave Software, Inc.** | Web search, when a request uses it                          | The search query, which may reflect your message. No user identifier is sent, and the request carries our server's address rather than yours           | United States          |

### Points worth noting

**Cloudflare receives the most.** It is the only organisation on this list that handles
request and response bodies in the clear, because TLS terminates at the edge. That means
prompt and response content passes through it in transit. That is inherent to using an
edge network for DDoS and firewall protection, and it is why the Privacy Policy lists the
edge as a place your content exists.

**Backups contain everything.** Off-site backups are whole-database copies, so any
category of data that is live when a backup is taken is inside it. Backblaze holds
ciphertext only and cannot read any of it.

**Brave Search is conditional.** It receives a query only when a request triggers a web
search, and the feature is off by default.

**Not on this list:** our object storage, observability systems and the language models
all run on our own infrastructure and are operated by us.

## International transfers

We are established in Jamaica, which is not the subject of an EU adequacy decision. Data
reaching the organisations above leaves Jamaica.

**Into Jamaica.** Where a business customer sends us personal data governed by the GDPR or
UK GDPR, that customer is the exporter and we are the importer. We offer the European
Commission's **Standard Contractual Clauses (Module Two)** and the **UK International Data
Transfer Addendum** for that transfer, in full, in our
[Data Processing Addendum](data_processing_addendum.md). An individual who signs up
directly and sends us their own data is not making a restricted transfer, and needs no
safeguard for it.

**Out of Jamaica.** Onward transfers to the organisations above are restricted by two
separate laws — Chapter V of the GDPR, where it applies, and the Jamaican Data Protection
Act 2020, which applies to everyone's data regardless of where they live. They are made
under [PENDING: transfer mechanism].

On request we will provide the executed safeguards and the transfer impact assessment
supporting them — dpo@openjm.ai.

## Changes to this list

We will give registered users at least **30 days' notice** by email before adding or
replacing an organisation on this list.

**If you object.** You may object on reasonable data-protection grounds within that
period. If we cannot accommodate your objection, you may close your account and reclaim
your unused credit balance under Section 6 of the
[Terms of Service](terms_of_service.md).

## Contact

Questions, or to object to a new sub-processor: dpo@openjm.ai.

**Open Jamaica AI Limited**, 53 Lady Musgrave Road, Kingston 8, Jamaica.
Company number 1377772.
