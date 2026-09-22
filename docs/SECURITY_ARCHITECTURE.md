# CloudGuard AI — Security Architecture & Key Management

**Version:** 2.0  
**Classification:** Enterprise Security Baseline  
**Standard:** NIST SP 800-38D (AES-256-GCM) & NIST SP 800-63B (Identity & Auth)  

---

## 1. Cryptographic Key Management & AES-256-GCM Lifecycle

CloudGuard AI implements authenticated symmetric encryption using **AES-256-GCM** (Galois/Counter Mode) to protect cloud credentials, access tokens, and sensitive tenant metadata at rest.

```
                  ┌────────────────────────────────────────┐
                  │ ENCRYPTION_KEY (Environment / KMS)     │
                  │ 256-bit Entropy (32 raw bytes)         │
                  └───────────────────┬────────────────────┘
                                      │
           ┌──────────────────────────┴──────────────────────────┐
           ▼                                                     ▼
┌──────────────────────────────────────┐       ┌──────────────────────────────────────┐
│       ENCRYPTION OPERATION           │       │       DECRYPTION OPERATION           │
│                                      │       │                                      │
│  1. Generate 96-bit Random Nonce/IV  │       │  1. Extract 12-byte Nonce & Tag      │
│     (os.urandom(12) — Unique per Op) │       │                                      │
│  2. AES-GCM Encrypt with Key         │       │  2. AES-GCM Authenticated Decrypt    │
│  3. Compute 128-bit Auth Tag         │       │  3. Verify Auth Tag (NIST SP 800-38D)│
│  4. Output: Base64(Nonce +           │       │  4. Tampered? → Abort with Error     │
│             Ciphertext + Tag)        │       │     Valid?    → Return Plaintext     │
└──────────────────────────────────────┘       └──────────────────────────────────────┘
```

### Encryption Invariants
- **Algorithm:** AES-256-GCM (Authenticated Encryption with Associated Data).
- **Key Storage:** Stored exclusively in environment variables or cloud secret managers (AWS Secrets Manager, Azure Key Vault, GCP Secret Manager). Never committed to Git.
- **Nonce/IV Guarantee:** Every single encryption operation generates a cryptographically fresh 96-bit (12-byte) random nonce using `os.urandom()`. Static nonces are strictly prohibited.
- **Integrity Guarantee:** Decryption verifies the 16-byte authentication tag before returning any plaintext. Tampered or bit-flipped payloads immediately trigger an authentication failure exception.

---

## 2. Password Storage Architecture (Argon2id)

Passwords are **NEVER encrypted** (as encryption is reversible). Instead, passwords are irreversibly hashed using **Argon2id** (the winner of the Password Hashing Competition):

| Parameter | Configuration Value | Rationale |
|---|---|---|
| **Algorithm** | `Argon2id` (v=19) | Hybrid defense against GPU cracking and side-channel attacks |
| **Time Cost ($t$)** | `2` iterations | Computational delay against brute force |
| **Memory Cost ($m$)** | `65536` KiB (64 MiB) | High memory hardness preventing ASIC hardware acceleration |
| **Parallelism ($p$)** | `1` thread | Predictable server CPU utilization |
| **Salt** | Cryptographically random 16 bytes | Prevents rainbow tables |
| **Fallback** | `PBKDF2-HMAC-SHA256` (100,000 iters) | Seamless compatibility in restricted environments |

---

## 3. JWT Dual-Key Token Lifecycle

Authentication uses two decoupled symmetric secrets:
1. `JWT_SECRET_KEY`: Signs short-lived access tokens (60 minutes).
2. `JWT_REFRESH_SECRET_KEY`: Signs long-lived refresh tokens (7 days).

Access tokens carry role claims (`ADMIN`, `SECURITY_ANALYST`, `VIEWER`) and are validated on every request via FastAPI dependency injection (`require_role`).

---

## 4. Tamper-Evident SHA-256 Chained Audit Ledger

Every administrative and automated remediation action is permanently recorded in an append-only cryptographic ledger:

```
[Genesis Block: Hash 0000...0000]
         │
         ▼
[Record #1: SHA-256(GenesisHash | Seq=1 | USER_LOGIN | analyst@customer.corp | ...)]
         │
         ▼
[Record #2: SHA-256(Record#1Hash | Seq=2 | REMEDIATION_EXECUTED | res-s3-finance | ...)]
         │
         ▼
[Record #3: SHA-256(Record#2Hash | Seq=3 | SCAN_COMPLETED | ...)]
```

Continuous verification endpoints (`GET /api/v1/analytics/audit/verify`) mathematically validate the sequence chain from genesis to head.
