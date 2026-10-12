# Voice Ledger Lite

Voice Ledger Lite is a beginner-friendly multilingual voice-based udhaar
(credit) ledger for small shopkeepers.

It lets you record customer credit and payments using voice or text.

The project supports:

- English
- Hindi
- Gujarati

It uses the browser's Web Speech API for voice input and SQLite for local
ledger storage.

---

## Features

### Voice entry

Speak a transaction such as:

    Jai Patel taken debt of 500

or:

    जय पटेल 500 उधार

or:

    જય પટેલ ને 300 ઉધાર

The app converts the speech into:

- Customer name
- Amount
- Transaction type

You can review the result before saving.

---

### Credit and payment tracking

The app supports:

- Udhaar given
- Payment received

For example:

    Jai Patel taken debt of 500

followed by:

    Jai Patel paid 200

produces a current balance of:

    ₹300

---

### Multilingual customer matching

The application attempts to match the same customer across:

- English
- Devanagari Hindi
- Gujarati

For example:

    Jai Patel
    जय पटेल
    જય પટેલ

can be matched using a transliteration-based name key.

---

### Customer history

Each customer has a transaction history showing:

- Udhaar given
- Payment received
- Amount
- Date and time
- Current balance

---

### Edit transactions

Existing transactions can be edited.

You can change:

- Amount
- Transaction type

---

### Delete transactions

Transactions can be permanently deleted after a confirmation step.

---

### WhatsApp reminder

The Remind button creates a pre-filled WhatsApp message containing the
customer's current pending balance.

The application does not automatically send the message.

---

## Technology

Backend:

- Python
- Flask
- SQLite
- Python built-in `sqlite3`

Frontend:

- HTML
- CSS
- Vanilla JavaScript

Voice:

- Browser Web Speech API

Additional Python package:

- indic-transliteration

No ORM is used.

No React or Bootstrap is used.

No login system is included.

No cloud database is required.

---

# Project Structure

```text
voice-ledger-lite/
│
├── app.py
├── parser.py
├── requirements.txt
├── README.md
├── .gitignore
│
├── ledger.db
│
├── backups/
│
├── templates/
│   └── index.html
│
└── static/
    ├── style.css
    └── script.js
