
import math
import sqlite3
from contextlib import contextmanager
from pathlib import Path

from flask import Flask, jsonify, render_template, request

from parser import name_key, parse


BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "ledger.db"

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 64 * 1024


# =========================================================
# Database connection and transaction management
# =========================================================

@contextmanager
def get_db():
    """
    Open one SQLite connection per operation.

    Commit successful operations, roll back failed ones,
    and always close the connection.
    """
    connection = sqlite3.connect(
        DB_PATH,
        timeout=10
    )

    connection.row_factory = sqlite3.Row

    try:
        connection.execute("PRAGMA foreign_keys = ON")

        yield connection

        connection.commit()

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


def init_db():
    with get_db() as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE COLLATE NOCASE
            );

            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                type TEXT NOT NULL
                    CHECK (type IN ('credit', 'payment')),
                amount REAL NOT NULL
                    CHECK (amount > 0),
                created_at TEXT NOT NULL
                    DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id)
                    REFERENCES customers(id)
            );
            """
        )


# =========================================================
# Response and validation helpers
# =========================================================

def json_error(message, status_code=400):
    return jsonify({"error": message}), status_code


def get_json_object():
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else None


def validate_name(value):
    if not isinstance(value, str):
        return None, "Customer name must be text."

    name = value.strip()

    if not name:
        return None, "Customer name is required."

    if len(name) > 100:
        return None, "Customer name must be 100 characters or fewer."

    if not any(character.isalnum() for character in name):
        return None, "Please enter a valid customer name."

    return name, None


def validate_amount(value):
    if isinstance(value, bool):
        return None, "Amount must be a valid number."

    if not isinstance(value, (int, float, str)):
        return None, "Amount must be a valid number."

    if isinstance(value, str):
        value = value.strip()

        if not value:
            return None, "Amount is required."

    try:
        amount = float(value)
    except (TypeError, ValueError, OverflowError):
        return None, "Amount must be a valid number."

    if not math.isfinite(amount):
        return None, "Amount must be a finite number."

    if amount <= 0:
        return None, "Amount must be greater than zero."

    if amount > 1_000_000_000_000:
        return None, "Amount is too large."

    rounded = round(amount, 2)

    if not math.isclose(
        amount,
        rounded,
        rel_tol=0,
        abs_tol=1e-9
    ):
        return None, "Amount can have at most two decimal places."

    return rounded, None


def validate_transaction_type(value):
    if value not in {"credit", "payment"}:
        return None, "Type must be either credit or payment."

    return value, None


def find_customer_by_name_key(db, incoming_name):
    incoming_key = name_key(incoming_name)

    if not incoming_key:
        return None

    rows = db.execute(
        "SELECT id, name FROM customers ORDER BY id"
    ).fetchall()

    for row in rows:
        if name_key(row["name"]) == incoming_key:
            return row

    return None


# =========================================================
# Main page
# =========================================================

@app.route("/")
def index():
    return render_template("index.html")


# =========================================================
# Parse entry
# =========================================================

@app.post("/parse")
def parse_entry():
    data = get_json_object()

    if data is None:
        return json_error("Please send a valid JSON object containing the entry.")

    text = data.get("text")

    if not isinstance(text, str):
        return json_error("Entry text must be text.")

    text = text.strip()

    if not text:
        return json_error("Please enter or speak an entry.")

    if len(text) > 2000:
        return json_error("Entry is too long. Please use 2,000 characters or fewer.")

    try:
        result = parse(text)

        name, error = validate_name(result.get("name"))
        if error:
            return json_error("I could not find a valid customer name.")

        amount, error = validate_amount(result.get("amount"))
        if error:
            return json_error("I could not find a valid amount. Please check the entry.")

        transaction_type, error = validate_transaction_type(
            result.get("type")
        )
        if error:
            return json_error("I could not determine the transaction type.")

        return jsonify({
            "name": name,
            "amount": amount,
            "type": transaction_type
        })

    except ValueError as exc:
        return json_error(str(exc))

    except Exception:
        app.logger.exception("Unexpected parser error")
        return json_error(
            "Sorry, I could not understand that entry. Please try again.",
            500
        )


# =========================================================
# Save entry — customer and transaction are one operation
# =========================================================

@app.post("/save")
def save_entry():
    data = get_json_object()

    if data is None:
        return json_error("Invalid save request. Please try again.")

    name, error = validate_name(data.get("name"))
    if error:
        return json_error(error)

    amount, error = validate_amount(data.get("amount"))
    if error:
        return json_error(error)

    transaction_type, error = validate_transaction_type(
        data.get("type")
    )
    if error:
        return json_error(error)

    try:
        with get_db() as db:
            customer = find_customer_by_name_key(db, name)

            if customer is None:
                cursor = db.execute(
                    "INSERT INTO customers (name) VALUES (?)",
                    (name,)
                )
                customer_id = cursor.lastrowid
            else:
                customer_id = customer["id"]

            db.execute(
                """
                INSERT INTO transactions (customer_id, type, amount)
                VALUES (?, ?, ?)
                """,
                (customer_id, transaction_type, amount)
            )

        # Reached only after the connection context commits.
        return jsonify({
            "message": "Entry saved",
            "customer_id": customer_id
        })

    except sqlite3.IntegrityError:
        app.logger.exception("Database constraint error while saving entry")
        return json_error(
            "This entry could not be saved. Please check the details and try again.",
            409
        )

    except sqlite3.OperationalError as exc:
        app.logger.exception("Database operation failed while saving entry")

        if "locked" in str(exc).lower() or "busy" in str(exc).lower():
            return json_error(
                "The ledger is busy. Please wait a moment and try again.",
                503
            )

        return json_error("Could not save the entry. Please try again.", 500)

    except sqlite3.Error:
        app.logger.exception("Database error while saving entry")
        return json_error("Could not save the entry. Please try again.", 500)


# =========================================================
# Ledger
# =========================================================

@app.get("/ledger")
def ledger():
    try:
        with get_db() as db:
            rows = db.execute(
                """
                SELECT
                    c.id,
                    c.name,
                    COALESCE(
                        SUM(
                            CASE WHEN t.type = 'credit'
                            THEN t.amount ELSE 0 END
                        ), 0
                    ) -
                    COALESCE(
                        SUM(
                            CASE WHEN t.type = 'payment'
                            THEN t.amount ELSE 0 END
                        ), 0
                    ) AS balance
                FROM customers c
                LEFT JOIN transactions t ON t.customer_id = c.id
                GROUP BY c.id, c.name
                ORDER BY balance DESC, c.name COLLATE NOCASE ASC
                """
            ).fetchall()

        customers = [
            {
                "id": row["id"],
                "name": row["name"],
                "balance": round(row["balance"], 2)
            }
            for row in rows
        ]

        total = round(
            sum(max(customer["balance"], 0) for customer in customers),
            2
        )

        return jsonify({
            "customers": customers,
            "total": total
        })

    except sqlite3.Error:
        app.logger.exception("Database error while loading ledger")
        return json_error("Could not load the ledger. Please try again.", 500)


# =========================================================
# Customer transaction history
# =========================================================

@app.get("/customer/<int:customer_id>/transactions")
def customer_transactions(customer_id):
    try:
        with get_db() as db:
            customer = db.execute(
                "SELECT id, name FROM customers WHERE id = ?",
                (customer_id,)
            ).fetchone()

            if customer is None:
                return json_error("Customer not found.", 404)

            totals = db.execute(
                """
                SELECT
                    COALESCE(SUM(
                        CASE WHEN type = 'credit'
                        THEN amount ELSE 0 END
                    ), 0) AS total_credit,
                    COALESCE(SUM(
                        CASE WHEN type = 'payment'
                        THEN amount ELSE 0 END
                    ), 0) AS total_payment
                FROM transactions
                WHERE customer_id = ?
                """,
                (customer_id,)
            ).fetchone()

            transactions = db.execute(
                """
                SELECT id, type, amount, created_at
                FROM transactions
                WHERE customer_id = ?
                ORDER BY id DESC
                """,
                (customer_id,)
            ).fetchall()

        total_credit = round(totals["total_credit"], 2)
        total_payment = round(totals["total_payment"], 2)

        return jsonify({
            "customer": {
                "id": customer["id"],
                "name": customer["name"]
            },
            "balance": round(total_credit - total_payment, 2),
            "total_credit": total_credit,
            "total_payment": total_payment,
            "transactions": [
                {
                    "id": row["id"],
                    "type": row["type"],
                    "amount": round(row["amount"], 2),
                    "created_at": row["created_at"]
                }
                for row in transactions
            ]
        })

    except sqlite3.Error:
        app.logger.exception("Database error while loading customer history")
        return json_error("Could not load transaction history.", 500)


# =========================================================
# Update transaction
# =========================================================

@app.put("/transaction/<int:transaction_id>")
def update_transaction(transaction_id):
    data = get_json_object()

    if data is None:
        return json_error("Invalid update request. Please try again.")

    amount, error = validate_amount(data.get("amount"))
    if error:
        return json_error(error)

    transaction_type, error = validate_transaction_type(data.get("type"))
    if error:
        return json_error(error)

    try:
        with get_db() as db:
            transaction = db.execute(
                "SELECT id, customer_id FROM transactions WHERE id = ?",
                (transaction_id,)
            ).fetchone()

            if transaction is None:
                return json_error("Transaction not found.", 404)

            customer_id = transaction["customer_id"]

            db.execute(
                """
                UPDATE transactions
                SET type = ?, amount = ?
                WHERE id = ?
                """,
                (transaction_type, amount, transaction_id)
            )

        return jsonify({
            "message": "Transaction updated",
            "transaction_id": transaction_id,
            "customer_id": customer_id
        })

    except sqlite3.OperationalError as exc:
        app.logger.exception("Database operation failed while updating transaction")

        if "locked" in str(exc).lower() or "busy" in str(exc).lower():
            return json_error("The ledger is busy. Please try again shortly.", 503)

        return json_error("Could not update the transaction. Please try again.", 500)

    except sqlite3.Error:
        app.logger.exception("Database error while updating transaction")
        return json_error("Could not update the transaction. Please try again.", 500)


# =========================================================
# Delete transaction
# =========================================================

@app.delete("/transaction/<int:transaction_id>")
def delete_transaction(transaction_id):
    try:
        with get_db() as db:
            transaction = db.execute(
                "SELECT id, customer_id FROM transactions WHERE id = ?",
                (transaction_id,)
            ).fetchone()

            if transaction is None:
                return json_error("Transaction not found.", 404)

            customer_id = transaction["customer_id"]

            db.execute(
                "DELETE FROM transactions WHERE id = ?",
                (transaction_id,)
            )

        return jsonify({
            "message": "Transaction deleted",
            "transaction_id": transaction_id,
            "customer_id": customer_id
        })

    except sqlite3.OperationalError as exc:
        app.logger.exception("Database operation failed while deleting transaction")

        if "locked" in str(exc).lower() or "busy" in str(exc).lower():
            return json_error("The ledger is busy. Please try again shortly.", 503)

        return json_error("Could not delete the transaction. Please try again.", 500)

    except sqlite3.Error:
        app.logger.exception("Database error while deleting transaction")
        return json_error("Could not delete the transaction. Please try again.", 500)


# =========================================================
# Friendly HTTP errors
# =========================================================

@app.errorhandler(413)
def request_too_large(_error):
    return json_error(
        "Request is too large. Please shorten the entry and try again.",
        413
    )


@app.errorhandler(404)
def page_not_found(_error):
    if request.path.startswith(
        ("/parse", "/save", "/ledger", "/customer/", "/transaction/")
    ):
        return json_error("The requested resource was not found.", 404)

    return "Page not found.", 404


@app.errorhandler(405)
def method_not_allowed(_error):
    return json_error(
        "This request method is not supported for this route.",
        405
    )


if __name__ == "__main__":
    init_db()
    app.run(debug=True)
