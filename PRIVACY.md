# Privacy Policy

**Last updated:** May 6, 2026

---

## Summary

Share Secrets is designed with privacy and minimal data collection in mind. The core principle is **zero-trust**: encryption and decryption occur entirely in the user's browser. The server never receives plaintext secrets or user passphrases.

---

## What We Store

| Data | Details |
|------|---------|
| **Ciphertext only** | Encrypted secret blobs sent by clients, including encrypted file payloads and associated metadata. The server never receives decrypted file contents or filenames. |
| **Minimal metadata** | Creation timestamp, expiration time, and one-time access state — required for operation only. |
| **In-memory storage** | Data is held in short-lived memory with no persistent database by default. |

---

## What We Do Not Collect

- Plaintext secrets, user passphrases, plaintext files, or filenames
- Names, email addresses, or other personal identifiers
- Persistent analytics or user-tracking data

---

## Logs & Debugging

- Short-lived server logs may include request IDs and timestamps for debugging purposes.
- Logs do **not** contain plaintext secrets, encrypted content blobs, or file data.
- Only minimal diagnostic identifiers are retained for troubleshooting.

---

## Self-Hosting

If you self-host Share Secrets, you have full control over all data and retention policies. The [MIT License](./LICENSE) permits running and modifying the software to meet your own privacy requirements.

---

## Contact

For privacy questions or to report a concern, please open an issue in the project repository:

**[github.com/vancehenricks/sharesecrets/issues](https://github.com/vancehenricks/sharesecrets/issues)**
