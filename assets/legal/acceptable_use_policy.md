# Acceptable Use Policy

> Version 1.1 · Effective September 1st, 2026

## 1. Purpose

This Acceptable Use Policy ("AUP") defines what you may and may not do with the OpenJM
Service. It is incorporated into the [Terms of Service](terms_of_service.md) and forms
part of your agreement with **Open Jamaica AI Limited**. Violation may result in
suspension or termination under Section 6.

We change this policy on the notice terms in Section 18 of the Terms.

## 2. Permitted Uses

You may use the Service to:

- Build applications, tools, and workflows that benefit your users or business.
- Process data you have the right to process.
- Conduct legitimate security research under responsible disclosure norms — see the
  authorised-security-work exception in Section 3.2, and the
  [Security Policy](security_policy.md) for how to report what you find and how to
  request authorisation to test us.
- Learn about AI, language models, or software development.

## 3. Prohibited Uses

### 3.1 Illegal and Harmful Content

You must not use the Service to generate, assist with, or facilitate:

- Content that is illegal in Jamaica or in your jurisdiction.
- Child sexual abuse material (CSAM) or any content that sexualises minors.
- Content designed to incite violence, terrorism, or mass casualties.
- Defamatory, fraudulent, or deceptive content intended to harm individuals.

### 3.2 Cyber-Offense and Malware

You must not use the Service to:

- Generate, refine, or deploy malware, ransomware, spyware, or exploit code
  intended for unauthorized use against real systems.
- Develop cyberattack tools targeting infrastructure you do not own or have
  explicit written permission to test.
- Write phishing emails, smishing messages, or social-engineering scripts
  intended to deceive real victims.
- Produce code designed to bypass security controls, exfiltrate data, or
  establish unauthorized persistence.

**Exception — authorized security work:** Penetration testers, security researchers, and
CTF participants working against systems they own or have explicit written authorization
to test are permitted to use the Service for such authorized work.

### 3.3 Spam, Fraud, and Manipulation

You must not use the Service to:

- Generate bulk unsolicited communications (email spam, SMS spam).
- Operate bot farms for social media manipulation, coordinated inauthentic
  behavior, or astroturfing campaigns.
- Produce fraudulent financial documents, fake legal instruments, or
  impersonation content.
- Run scam operations (romance scams, advance-fee fraud, impersonation fraud).

### 3.4 Privacy Violations

You must not use the Service to:

- Process personal data without a lawful basis for doing so.
- Submit special-category data — health, biometric, genetic, sexual, religious,
  political or trade-union data — without a valid condition under Article 9 GDPR or the
  equivalent in your law. We neither ask for nor need it; see the
  [Privacy Policy](privacy_policy.md), Section 5.
- Re-identify individuals from anonymized data.
- Aggregate data in ways that violate applicable privacy law.

If you submit other people's personal data in the course of a business, the
[Data Processing Addendum](data_processing_addendum.md) applies and you are the
controller of that data.

### 3.5 Interference with the Service

You must not:

- Attempt to reverse-engineer, circumvent rate limits, or probe the infrastructure of the
  Service without authorization. To request authorization to test us, see the
  [Security Policy](security_policy.md).
- Resell API access without our written consent.
- Share API keys with third parties in ways that violate your account terms.

### 3.6 Uploaded Files

The Service accepts files you upload so they can be analysed or shown to a model.

You must not upload:

- Content prohibited anywhere else in this Section 3 — an image or document does not become
  acceptable by arriving as a file rather than as text.
- Material you do not have the right to store or process, including personal data about others
  you have no lawful basis to share with us.
- Files intended to attack the Service or its other users: malware, content crafted to exploit
  a parser, or archives designed to expand without bound.
- Content whose purpose is to make a model produce output that violates this policy.

Uploaded files are treated as your content and remain subject to all of Section 3. Apart
from the automated screening in Section 4, we do not review them; that is not the same as
permitting anything.

### 3.7 Code Execution

The Service can run Python you or the model supplies, in an isolated sandbox, to compute
results and produce files. That sandbox has no network access, no access to our
infrastructure, and is destroyed after use.

You must not:

- Attempt to escape, disable, or probe the boundaries of the execution sandbox, or use it to
  reach any host, network, or service outside it.
- Use code execution to mine cryptocurrency, run distributed computation for third parties, or
  otherwise consume compute disproportionate to a genuine request.
- Execute code that you do not have the right to run, or that processes data you do not have
  the right to process.
- Use generated files to distribute malware, phishing content, or material prohibited elsewhere
  in this policy. Files we generate on your behalf are your content and remain subject to all
  of Section 3.
- Deliberately provoke resource exhaustion — fork bombs, allocation loops, or filling the
  workspace — to degrade the Service for others.

Attempts to break sandbox isolation are treated as attacks on the Service under Section 3.2 and
may result in immediate termination without warning.

## 4. Content moderation

Requests and generated responses are screened automatically for content prohibited by
Section 3. Screening is done by a classifier, not by staff reading your conversations. We
record the fact of a flag, its category and the action taken — not the content. See the
[Privacy Policy](privacy_policy.md), Section 6.

We use a graduated model:

| Severity                                  | Action                                       | Decided by                                   |
| ----------------------------------------- | -------------------------------------------- | -------------------------------------------- |
| Incidental / borderline                   | Request blocked; warning                     | Automated                                    |
| Repeated or clear violation               | Temporary suspension                         | A person                                     |
| Severe (CSAM, mass-casualty, live attack) | Immediate termination; report to authorities | A person; permanent termination requires two |

Any action against your **account**, as opposed to an individual request, is taken by a
person. See the [AI Transparency Notice](ai_transparency.md), Section 6.

Where we are legally obliged to report content — child sexual abuse material in
particular — we will preserve only what the report requires, for as long as the receiving
authority requires it. See the [Privacy Policy](privacy_policy.md), Section 13.

## 5. Reporting violations

To report misuse of the Service: **abuse@openjm.ai**.
To report a security vulnerability: **security@openjm.ai** — see the
[Security Policy](security_policy.md).
To report copyright infringement: **copyright@openjm.ai** — see the
[Copyright Policy](copyright_policy.md).

We aim to acknowledge abuse reports within 48 hours.

## 6. Enforcement and appeals

We may suspend or terminate an account that violates this AUP, on the terms in Sections
14 and 15 of the [Terms of Service](terms_of_service.md). Where a violation can be put
right, we will normally give you notice and a chance to do so first; for severe
violations we may act immediately. We may report illegal activity to law enforcement.

**Appeals.** You may appeal any enforcement decision, including an automated block, by
emailing legal@openjm.ai within **14 days** of the action. A person who was not involved
in the original decision will review it, and we will tell you the outcome and the reason.
An appeal does not by itself suspend the action.

## 7. Contact

**Open Jamaica AI Limited**, 53 Lady Musgrave Road, Kingston 8, Jamaica.
Company number 1377772.
