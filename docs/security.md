# Security, key management and data protection

## Encryption at rest

The API encrypts session notes and self-care reflection text before they
reach the database. It uses **AES-256-GCM** (`server/src/utils/crypto.ts`):

- **A fresh random IV.** Every value gets a new 12-byte IV, so the same note
  never encrypts the same way twice.
- **Tamper detection.** A GCM authentication tag detects any change to stored
  ciphertext, and decryption then fails. This is unit-tested.
- **Versioned format.** Values are stored as `v1:<iv>:<tag>:<ciphertext>`. The
  `v1` prefix names the key and format version, so a new key can be added later
  without breaking old data.

Passwords are stored as bcrypt hashes and session tokens as SHA-256 hashes.
Neither can be turned back into the original, so neither needs a key.

## Where the encryption key is kept

The API needs the key **while it runs**, to encrypt and decrypt notes. A
password manager can't hand a key to a running server, so the key is kept in
two places, each with its own job:

| Copy | Where | Purpose | Who can see it |
|---|---|---|---|
| **Live copy** | A secret environment variable (`ENCRYPTION_KEY`) on the API host (Render). Render stores secrets encrypted and only gives them to the running service | The API reads it once, at start-up | Only the project owner, through the Render dashboard (two-factor authentication on) |
| **Backup copy** | A password manager (e.g. Bitwarden), with two-factor authentication | Recovery if the host is rebuilt, and future key rotation. If every copy is lost, existing notes can never be read again | Only the project owner |

The key is never:

- in the code or the Git repository: `.env` files are git-ignored, and `.env.example` leaves the key blank;
- in the database;
- sent to the browser or written to logs.

In development and tests, the API uses a fixed dev key that is public. That
key protects nothing. It exists only so the project runs with no setup.
`config.ts` **refuses to start in production** without a real 32-byte key, so
the dev key can never reach a live system by accident.

### Why the key sits on the API host, not with the data

The key and the encrypted data live on **separate services**: the key on the
API web service, the data on the database service. Anyone who gets a database
dump or backup gets only ciphertext.

| Threat | Protected? | How |
|---|---|---|
| A database dump, backup or SQL injection leaks the tables | Yes | Notes are ciphertext. Tokens and passwords are one-way hashes. The key is not in the database |
| Someone changes stored notes | Detected | The GCM tag check fails and the API refuses the value |
| The source code is published (the repo is public) | Yes | The key is not in the code |
| An attacker fully controls the running API server | No. This is true of any app that must read its own data | Reduced by two-factor authentication on the host, few dependencies, security headers (helmet) and rate limits |
| The owner loses the key | Recoverable | Backup copy in the password manager |

Future work:

- **Key rotation.** A script that re-encrypts stored values with a new key
  (`v2`) while still reading `v1`.
- **Managed keys.** A key management service (KMS) if Beacon grows beyond one
  university.

## Hosting and Rwanda's data protection law

Beacon processes personal data, so it falls under **Law No. 058/2021 relating
to the protection of personal data and privacy**. Usernames are pseudonyms,
but the law still treats pseudonymous data as personal data.

- **Article 50: storing data outside Rwanda.** This is allowed only if the
  controller or processor holds a valid **registration certificate from the
  National Cyber Security Authority (NCSA)** that authorises storage abroad.
- **Articles 48–49: cross-border transfer.** Personal data may go to a third
  party outside Rwanda only on listed grounds, such as NCSA authorisation or
  the person's consent. A written contract is also required.
- **Registration.** Controllers and processors must register with the NCSA's
  Data Protection and Privacy Office.

Render and Vercel run their servers outside Rwanda, so Beacon follows a
two-step plan:

1. **Demonstration deployment (now).** The deployed site holds only the seeded
   demo accounts and test data, for the capstone demonstration. It stores no
   real participants' personal data.
2. **Before real use, one of these two options:**
   - **Register with the NCSA** and get authorisation to store data abroad.
     Then sign data-processing terms with the host, and state the legal basis
     for the transfer in the privacy notice.
   - **Host the API and database in Rwanda**, with a local provider or data
     centre. No code changes are needed: Beacon is a standard Node.js and
     PostgreSQL app with no vendor-specific services. On the new host:
     1. Set `DATABASE_URL`, `ENCRYPTION_KEY` and the seed passwords.
     2. Run `npm run start:prod`.

     The front end holds no personal data, so it can stay on Vercel's CDN. Only
     `API_URL` needs to change.

Both options change only how Beacon is deployed, not its code. ALU is the
likely data controller, so it would choose between them together with its
data protection officer.

**Sources:**

- Law No. 058/2021 (Official Gazette, 15 October 2021).
- [DLA Piper: Data protection in Rwanda](https://www.dlapiperdataprotection.com/?c=RW&t=law).
- [PwC Rwanda: Navigating cross-border data transfer](https://www.pwc.com/rw/en/assets/pdf/legal-alert-navigating-cross-border-data-transfer.pdf).

Check the official text of the law and the NCSA's current procedure before
relying on these details.
