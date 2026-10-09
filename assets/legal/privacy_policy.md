# Privacy Policy

> Version 1.1 · Effective September 1st, 2026

## 1. Who we are

OpenJM is an AI inference service operated by **Open Jamaica AI Limited**, a company
incorporated in Jamaica under company number 1377772, with its
registered office at 53 Lady Musgrave Road, Kingston 8, Jamaica. Inference runs on our
own hardware in Kingston.

Our application to register as a data controller with Jamaica's Office of the Information
Commissioner ("OIC") under the Data Protection Act 2020 is **pending**. We will publish
the registration number here once it is granted.

**Data Protection Officer:** Jezeel Martin — dpo@openjm.ai. Postal contact is the
registered office above.

**Our representative in the EU and UK**, appointed under Article 27 GDPR:
[PENDING: Article 27 representative]. You may raise any matter arising under the GDPR or
UK GDPR with our representative or with our Data Protection Officer.

## 2. Our two roles

Which role we are in decides who is answerable for what.

**We are the controller** of:

- your account, billing, technical and abuse-prevention data, however you use the
  Service; and
- the content you submit, where you use the Service as an individual for your own
  purposes.

This policy describes that processing.

**We are a processor** for personal data about other people — your end users, employees
or customers — that you submit through the Service as an organisation or in the course
of a business. There, **you** are the controller. You are responsible for having a lawful
basis and for giving your own users the notices they are owed. Our obligations to you are
in the [Data Processing Addendum](data_processing_addendum.md), and the companies listed
in Section 12 are our sub-processors for that data.

If you are an end user of a product built on OpenJM, the operator of that product — not
us — is the controller of your data, and you should read their privacy notice.

## 3. Data we collect

**Account data.** Email address, password hash, registration timestamp, plan and
subscription state. If you enable multi-factor authentication we store an encrypted
one-time-password secret.

**API usage metadata.** Request timestamps, model name, token counts, latency, cost, and
a conversation identifier if your client sends one. This is metadata about requests, not
their content.

**Billing data.** Credit balance, ledger transactions, invoice numbers, and payment
processor identifiers. We never receive or store card numbers; those pass directly from
your browser to our payment processor.

**Technical and abuse data.** IP address, browser user-agent, request headers and error
codes, used for rate limiting, quota enforcement and abuse prevention.

**Files you upload.** Filename, size, content type, checksum and the file itself. Files
are private to your account, are deleted automatically after 7 days, and can be deleted
sooner with `DELETE /v1/files/{id}`. Images referenced in a conversation are sent to the
model answering it.

**Files we generate.** Files produced by code execution are stored on the same terms and
for the same 7 days, so that you can download them.

**Long-term memory (optional, off by default).** If you enable memory, we store short
factual notes about you so that later conversations can use them. Section 6 explains how
those notes are created.

**Session memory (web chat).** If you use the web chat without an account, short facts
you state in the session are held for 2 hours so the conversation can refer back to them.
See the [Cookie Policy](cookie_policy.md), Section 3.

**Application and operational logs.** Diagnostic records of requests and system events —
timestamps, endpoints, status codes, error traces and hashed client IP addresses. These
do not contain prompt or response content.

**Moderation signals.** Where our content moderation flags a request, we record the fact
of the flag, the category and the action taken. See Section 6.

### Where your prompts and responses are held

We do not log your prompts or the model's responses, and we do not keep them permanently.
Completing a request does require holding content, and it passes through our edge network
on the way in. Every place it exists is listed here:

| Store                     | Contents                                                                           | Retained for                                      |
| ------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------- |
| Edge network (Cloudflare) | Request and response bodies **in transit** — TLS terminates at the edge            | In transit only; not stored by us                 |
| Request queue             | The full request, including messages                                               | **24 hours**                                      |
| Response store            | The generated response                                                             | **1 hour**                                        |
| Streaming buffer          | Partial response while streaming                                                   | **1 hour**                                        |
| Code-execution results    | Output of code you ran                                                             | **1 hour**                                        |
| Memory queue              | Conversation transcript, when memory is enabled                                    | **24 hours**                                      |
| Session memory (web chat) | Short facts you stated in the current session                                      | **2 hours**                                       |
| Long-term memory          | Notes about you, when memory is enabled                                            | Until you delete them                             |
| Encrypted backups         | Whole-database copies, so anything above that is still live when a backup is taken | Database **30 days**; transaction logs **3 days** |

Apart from automated content moderation (Section 6), these are processing buffers and we
do not read, index or mine them for any purpose beyond completing your request.

## 4. How we use your data

- To authenticate requests and enforce quotas.
- To produce a model response to your request.
- To debit credits and maintain your billing ledger.
- To screen requests for prohibited content and to detect and prevent abuse.
- To keep the Service secure and available, including off-site backups.
- To send transactional email about your account, password and billing. Never marketing.
- To comply with legal obligations and to respond to lawful requests (Section 13).

**We do not sell your data, and we do not use your prompts, responses or files to train
models.**

## 5. Special-category data

The Service accepts free text, so a prompt can contain anything you choose to type,
including data about health, beliefs, sexuality, biometrics or other special categories
under Article 9 GDPR. **We neither ask for nor need it.** We do not process it for any
purpose of our own; it is handled only as part of producing your response and is deleted
on the schedule in Section 3.

If you submit special-category data you are responsible for having a valid Article 9
condition for doing so. Please do not submit it unless you do. The
[AUP](acceptable_use_policy.md), Section 3.4, says the same.

## 6. Automated decisions, moderation and profiling

**You are interacting with an AI system.** Responses are generated by a language model
and may be inaccurate. See the [AI Transparency Notice](ai_transparency.md).

**Content moderation.** Requests and generated responses are screened automatically for
content prohibited by the [AUP](acceptable_use_policy.md). Screening is performed by an
automated classifier, not by staff reading your conversations. Where a request is
blocked, we record the flag, not the content. A block affects the individual request; any
decision that restricts your **account** — suspension, key revocation, termination — is
taken by a person, and a permanent termination requires two people. You can appeal under
Section 6 of the AUP, and you can ask for a human to review any automated block.

**Automated abuse blocking.** Requests to a set of trap URLs that no legitimate client
visits result in an automatic block of the originating IP address for 7 days. This is a
network-level block, not a judgement about you, and it is reversible — contact us and we
will review it.

**Long-term memory involves profiling.** When you enable it, a model reads your
conversations and derives durable facts about you — stated preferences, working style,
recurring goals — and reuses them in later answers. It is off unless you enable it. You
can list, export and delete these notes at any time, and deleting your account deletes
them.

**Quotas and rate limits** are automated, and determine only how quickly requests are
served. They produce no legal or similarly significant effect.

## 7. Legal basis (GDPR)

| What                                                                                                                   | Basis                                   |
| ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Accounts, authentication, serving your requests, billing, transactional email                                          | **Contract** — Art. 6(1)(b)             |
| Abuse prevention, rate limiting, content moderation, security, off-site backups and service continuity                 | **Legitimate interests** — Art. 6(1)(f) |
| Retaining records that substantiate issued invoices, for tax; maintaining the audit log; responding to lawful requests | **Legal obligation** — Art. 6(1)(c)     |
| Optional long-term memory                                                                                              | **Consent** — Art. 6(1)(a)              |

Where we rely on legitimate interests, we have weighed them against your rights. For
abuse prevention and moderation, the Service is open to unauthenticated users and is a
standing target for automated abuse and misuse; without these controls it cannot be kept
available or lawful. The processing is limited to network identifiers and the fact of a
flag, is not combined with account data to build profiles, and expires. You can object at
any time — see Section 10.

Where we rely on consent, you can withdraw it at any time by turning long-term memory off
and deleting your notes. Withdrawal does not affect processing carried out before it.

## 8. Data retention

| Data                            | Retained for                                                                                    |
| ------------------------------- | ----------------------------------------------------------------------------------------------- |
| Account data                    | Until you delete your account                                                                   |
| API usage metadata              | 400 days — see below                                                                            |
| Billing ledger                  | As long as tax and accounting law requires, and no longer — in the reduced form described below |
| Uploaded and generated files    | 7 days, or until you delete them                                                                |
| Prompts, responses, code output | 1–24 hours (see Section 3)                                                                      |
| Long-term memory                | Until you delete it                                                                             |
| Session memory (web chat)       | 2 hours                                                                                         |
| Moderation flags                | 12 months                                                                                       |
| Operational event records       | 30 days                                                                                         |
| Application logs                | 30 days                                                                                         |
| Blocked-abuse IP addresses      | 30 days in logs; the block itself lasts 7 days                                                  |
| Audit log                       | Retained (see Section 10)                                                                       |
| Encrypted off-site backups      | Database 30 days; transaction logs 3 days                                                       |

**Usage metadata and the billing ledger outlive account deletion, in reduced form.**
Those records substantiate invoices we have already issued and cannot be reconstructed
once discarded, so tax and accounting law requires us to keep them. When you delete your
account we **sever them from your identity**: the rows that back an invoice are retained
with the invoice number and amounts, and your email address, IP addresses and any other
identifier are removed. Everything else in your usage history is deleted outright.

## 9. Security

- Passwords are hashed with **Argon2id**.
- API keys are stored as a **peppered HMAC-SHA-256** digest, never in plaintext.
- Off-site backups are **encrypted before they leave our infrastructure**.
- All public endpoints use TLS, and our origin accepts traffic only through our edge
  network.
- Databases and caches are not reachable from the public internet.
- Code submitted for execution runs in an isolated sandbox with **no network access**.
- Restore drills are performed against real backups.

To report a vulnerability, see the [Security Policy](security_policy.md).

## 10. Your rights

| Right                                     | How                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| **Access**                                | `GET /v1/users/me/export`                                                      |
| **Portability**                           | the same endpoint returns machine-readable JSON                                |
| **Erasure**                               | `DELETE /v1/users/me`, or contact us                                           |
| **Rectification, restriction, objection** | dpo@openjm.ai                                                                  |
| **Withdraw consent** (long-term memory)   | turn memory off and delete your notes, or `DELETE /v1/memory`                  |
| **Human review of an automated decision** | dpo@openjm.ai, or appeal under AUP Section 6                                   |
| **Complaint**                             | Jamaica's OIC, or your local supervisory authority if you are in the EEA or UK |

The account export does not yet include long-term memory. Export those separately with
`GET /v1/memory/export`, and session memory with `DELETE /v1/memory/session` to erase it.

**We act on an erasure request immediately** and confirm within 30 days. Deleting your
account removes your API keys, uploaded and generated files, long-term memory,
application installations, password-reset records and operational event records, and
anonymises your account. Usage metadata and the billing ledger are reduced as described
in Section 8.

**Backups.** A deletion request cannot reach into an encrypted backup. Those copies age
out within 30 days (3 days for transaction logs), and our restore procedure re-applies
deletions, so a restore does not bring your data back.

**Audit records are retained.** Our audit log is an append-only, tamper-evident record
required for financial and security integrity, and entries cannot be removed from it
without destroying the integrity of the whole. Where deletion forfeits a credit balance,
the audit log records the amount without retaining your identity. Retaining it is
necessary for compliance with a legal obligation and for the establishment and defence of
legal claims — Art. 17(3)(b) and (e).

**If you are an end user of a product built on OpenJM**, address your request to that
product's operator. If you send it to us we will pass it on and tell you we have.

## 11. Children

The Service is not directed to children, and you must be 18 or older to use it, with or
without an account. We do not knowingly collect data from children. If you believe a child
has given us personal data, contact dpo@openjm.ai and we will delete it.

## 12. International transfers

We operate from Jamaica. The following processors receive personal data, some outside
Jamaica and outside the EEA:

| Processor       | Purpose                                                     | Data received                                                                                                | Location      |
| --------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------- |
| Cloudflare      | Edge network, TLS termination, DDoS and firewall protection | Request and response traffic in the clear, including your IP address, headers and message content in transit | Global edge   |
| Stripe          | Payments                                                    | Email address, amounts, subscription and payment identifiers                                                 | US / Ireland  |
| Mailgun (Sinch) | Transactional email                                         | Your email address and the contents of the message                                                           | United States |
| Backblaze B2    | Encrypted off-site backups                                  | Backups and log archives, encrypted before upload — ciphertext only                                          | United States |
| Brave Search    | Web search, when used                                       | The search query. No user identifier is sent                                                                 | United States |

The full list, with the detail behind each entry, is [Sub-processors](subprocessors.md).

**Your prompts are not sent to any third-party model provider.** Inference runs on our
own hardware in Kingston. Cloudflare does see request and response bodies, because TLS
terminates at the edge; that is inherent to using an edge network for DDoS protection.

Jamaica is not the subject of an EU adequacy decision, so where the GDPR applies, moving
personal data to and from Jamaica needs a safeguard under Chapter V.

**If you signed up yourself and use the Service for your own purposes**, sending us your
own data is not a restricted transfer — you are the data subject, not an exporter, and you
are choosing to send it. No safeguard is needed for that step, and the GDPR still protects
you: this policy, your rights in Section 10, and your right to complain to your own
supervisory authority all apply.

**If your data reaches us through a business** that uses OpenJM to build its product, that
business is the exporter and we are the importer. We offer the **European Commission's
Standard Contractual Clauses (Module Two)** for that transfer, together with the **UK
International Data Transfer Addendum** where the UK GDPR applies. They are set out in full
in our [Data Processing Addendum](data_processing_addendum.md).

**Our onward transfers** to the organisations in the table above are made under
[PENDING: transfer mechanism].

We keep an assessment of the laws of each destination country and the protections applied
there. You can ask for a copy of it, and of the safeguards in place, at dpo@openjm.ai.

## 13. Government and law-enforcement requests

We disclose personal data to a government agency, regulator or law enforcement only where
we are legally required to, and only what the request actually compels. We check that a
request is valid, comes from an authority with jurisdiction over us, and is properly
served; we push back on requests that are overbroad or defective.

**We will tell you** before disclosing data about you, so that you can object, unless we
are legally prohibited from doing so or there is an emergency involving a risk to life. If
we are prohibited, we will tell you once the prohibition lapses.

Separately, where we are obliged to report illegal content — child sexual abuse material
in particular — we will do so, and we will preserve only the material the report requires
for as long as the receiving authority requires it.

## 14. Data breaches

If a breach affects personal data we hold as controller, we will notify Jamaica's OIC
**and each affected data subject within 72 hours** of becoming aware of it, as the Data
Protection Act 2020 requires.

Where the GDPR applies, we will notify the competent supervisory authority within 72
hours and, where the breach is likely to result in a high risk to you, notify you without
undue delay.

Where we hold the data as your processor, we will notify **you** without undue delay so
that you can meet your own obligations. See the
[DPA](data_processing_addendum.md), Section 7.

Every notice will describe what happened, what we are doing about it, and how to reach our
Data Protection Officer.

## 15. Changes to this policy

We will notify registered users of material changes by email at least **30 days** before
they take effect. Continued use of the Service after the effective date is acceptance.

## 16. Contact

**Data Protection Officer:** Jezeel Martin — dpo@openjm.ai
**Open Jamaica AI Limited**, 53 Lady Musgrave Road, Kingston 8, Jamaica

We respond to data-subject requests without undue delay and in any event within one
month, and will tell you if we need to extend that where the law allows.
