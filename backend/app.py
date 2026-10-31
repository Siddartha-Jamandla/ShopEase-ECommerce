#!/usr/bin/env python3
"""
ShopEase E-Commerce - Full-stack backend (Python standard library only)
=======================================================================
REST API + SQLite database + static frontend hosting.

Run:        python3 backend/app.py            (from the repo root)
            python3 backend/app.py --port 8000

Then open:  http://localhost:8000/

Modules used (all stdlib): http.server, sqlite3, json, hashlib,
urllib, os, re, mimetypes, threading, datetime, secrets.
"""

import hashlib
import json
import mimetypes
import os
import re
import secrets
import sqlite3
import threading
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs, unquote

# ---------------------------------------------------------------- paths

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BACKEND_DIR)          # repo root: serves the frontend
DB_PATH = os.path.join(BACKEND_DIR, "shopease.db")
SCHEMA_PATH = os.path.join(BACKEND_DIR, "schema.sql")

PORT = int(os.environ.get("PORT", os.environ.get("SHOPEASE_PORT", "8000")))
ADMIN_KEY = os.environ.get("SHOPEASE_ADMIN_KEY", "admin-secret-change-me")

# ---------------------------------------------------------------- database

_db_lock = threading.Lock()


def get_db():
    """One connection per thread, guarded by a lock for writes."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    with _db_lock:
        conn = get_db()
        with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
            conn.executescript(f.read())
        conn.commit()
        conn.close()
    print(f"[shopease] database ready at {DB_PATH}")


# ---------------------------------------------------------------- auth

SESSIONS = {}  # token -> user_id  (in-memory; a restart logs everyone out)


def hash_password(password):
    salt = secrets.token_hex(16)
    digest = hashlib.sha256((salt + password).encode("utf-8")).hexdigest()
    return f"{salt}${digest}"


def verify_password(password, stored):
    try:
        salt, digest = stored.split("$", 1)
    except ValueError:
        return False
    return secrets.compare_digest(
        hashlib.sha256((salt + password).encode("utf-8")).hexdigest(), digest
    )


def make_token(user_id):
    token = f"{user_id}:{secrets.token_hex(24)}"
    SESSIONS[token] = user_id
    return token


def auth_user(headers):
    """Return user_id for a valid 'Authorization: Bearer <token>' header, else None."""
    auth = headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth[len("Bearer "):].strip()
    return SESSIONS.get(token)


# ---------------------------------------------------------------- helpers

def row_to_dict(row):
    return dict(row) if row is not None else None


def utcnow():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


class ApiError(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status
        self.message = message


# ---------------------------------------------------------------- handler

class ShopEaseHandler(BaseHTTPRequestHandler):
    server_version = "ShopEase/1.0"

    # -- response helpers -------------------------------------------------

    def _send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Key")

    def _ok(self, payload, status=200):
        self._send_json(status, {"ok": True, "data": payload})

    def _fail(self, status, message):
        self._send_json(status, {"ok": False, "error": message})

    def _read_json(self):
        length = int(self.headers.get("Content-Length", 0) or 0)
        if length <= 0:
            return {}
        try:
            return json.loads(self.rfile.read(length).decode("utf-8") or "{}")
        except (json.JSONDecodeError, UnicodeDecodeError):
            raise ApiError(400, "Invalid JSON body")

    def _require_auth(self):
        user_id = auth_user(self.headers)
        if user_id is None:
            raise ApiError(401, "Authentication required (send 'Authorization: Bearer <token>')")
        return user_id

    # -- routing -----------------------------------------------------------

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors_headers()
        self.end_headers()

    def do_GET(self):
        self._dispatch("GET")

    def do_POST(self):
        self._dispatch("POST")

    def do_PUT(self):
        self._dispatch("PUT")

    def do_DELETE(self):
        self._dispatch("DELETE")

    def _dispatch(self, method):
        try:
            parsed = urlparse(self.path)
            path = unquote(parsed.path)
            query = parse_qs(parsed.query)

            if path == "/api/health":
                return self._ok({"status": "ok", "time": utcnow()})

            if path == "/api/products":
                if method == "GET":
                    return self._api_products_list(query)
                if method == "POST":
                    return self._api_products_create()
                raise ApiError(405, "Method not allowed")

            m = re.fullmatch(r"/api/products/(\d+)", path)
            if m:
                if method == "GET":
                    return self._api_product_get(int(m.group(1)))
                raise ApiError(405, "Method not allowed")

            if path == "/api/register" and method == "POST":
                return self._api_register()
            if path == "/api/login" and method == "POST":
                return self._api_login()

            if path == "/api/cart":
                if method == "GET":
                    return self._api_cart_get()
                if method == "POST":
                    return self._api_cart_add()
                raise ApiError(405, "Method not allowed")

            m = re.fullmatch(r"/api/cart/(\d+)", path)
            if m:
                item_id = int(m.group(1))
                if method == "PUT":
                    return self._api_cart_update(item_id)
                if method == "DELETE":
                    return self._api_cart_delete(item_id)
                raise ApiError(405, "Method not allowed")

            if path == "/api/checkout" and method == "POST":
                return self._api_checkout()

            if path == "/api/orders" and method == "GET":
                return self._api_orders_list()

            m = re.fullmatch(r"/api/orders/(\d+)", path)
            if m and method == "GET":
                return self._api_order_get(int(m.group(1)))

            if path.startswith("/api/"):
                raise ApiError(404, "Unknown API endpoint")

            if method != "GET":
                raise ApiError(405, "Method not allowed")
            self._serve_static(path)

        except ApiError as e:
            self._fail(e.status, e.message)
        except BrokenPipeError:
            pass
        except Exception as e:  # never leak tracebacks to the client
            print(f"[shopease] ERROR {self.command} {self.path}: {e!r}")
            self._fail(500, "Internal server error")

    # -- products ----------------------------------------------------------

    def _api_products_list(self, query):
        category = (query.get("category", [""])[0] or "").strip()
        search = (query.get("search", [""])[0] or "").strip()
        sql = "SELECT * FROM products"
        clauses, params = [], []
        if category:
            clauses.append("category = ?")
            params.append(category)
        if search:
            clauses.append("(name LIKE ? OR description LIKE ?)")
            params += [f"%{search}%", f"%{search}%"]
        if clauses:
            sql += " WHERE " + " AND ".join(clauses)
        sql += " ORDER BY id"
        with _db_lock:
            rows = get_db().execute(sql, params).fetchall()
        self._ok([row_to_dict(r) for r in rows])

    def _api_product_get(self, product_id):
        with _db_lock:
            row = get_db().execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
        if row is None:
            raise ApiError(404, "Product not found")
        self._ok(row_to_dict(row))

    def _api_products_create(self):
        if self.headers.get("X-Admin-Key", "") != ADMIN_KEY:
            raise ApiError(403, "Admin key required (X-Admin-Key header)")
        body = self._read_json()
        name = str(body.get("name", "")).strip()
        price = body.get("price")
        if not name:
            raise ApiError(400, "Field 'name' is required")
        try:
            price = float(price)
        except (TypeError, ValueError):
            raise ApiError(400, "Field 'price' must be a number")
        if price < 0:
            raise ApiError(400, "Field 'price' must be >= 0")
        description = str(body.get("description", ""))
        category = str(body.get("category", "general")).strip() or "general"
        image_url = str(body.get("image_url", ""))
        try:
            stock = int(body.get("stock", 0))
        except (TypeError, ValueError):
            raise ApiError(400, "Field 'stock' must be an integer")
        if stock < 0:
            raise ApiError(400, "Field 'stock' must be >= 0")
        with _db_lock:
            conn = get_db()
            cur = conn.execute(
                "INSERT INTO products (name, description, price, category, image_url, stock)"
                " VALUES (?, ?, ?, ?, ?, ?)",
                (name, description, price, category, image_url, stock),
            )
            conn.commit()
            row = conn.execute("SELECT * FROM products WHERE id = ?", (cur.lastrowid,)).fetchone()
            conn.close()
        self._ok(row_to_dict(row), status=201)

    # -- auth --------------------------------------------------------------

    def _api_register(self):
        body = self._read_json()
        name = str(body.get("name", "")).strip()
        email = str(body.get("email", "")).strip().lower()
        password = str(body.get("password", ""))
        if not name:
            raise ApiError(400, "Field 'name' is required")
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email or ""):
            raise ApiError(400, "A valid 'email' is required")
        if len(password) < 6:
            raise ApiError(400, "Password must be at least 6 characters")
        with _db_lock:
            conn = get_db()
            if conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone():
                conn.close()
                raise ApiError(409, "An account with this email already exists")
            cur = conn.execute(
                "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
                (name, email, hash_password(password)),
            )
            conn.commit()
            user = row_to_dict(conn.execute(
                "SELECT id, name, email, created_at FROM users WHERE id = ?",
                (cur.lastrowid,)).fetchone())
            conn.close()
        token = make_token(user["id"])
        self._ok({"user": user, "token": token}, status=201)

    def _api_login(self):
        body = self._read_json()
        email = str(body.get("email", "")).strip().lower()
        password = str(body.get("password", ""))
        if not email or not password:
            raise ApiError(400, "Fields 'email' and 'password' are required")
        with _db_lock:
            conn = get_db()
            row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
            conn.close()
        if row is None or not verify_password(password, row["password_hash"]):
            raise ApiError(401, "Invalid email or password")
        user = {"id": row["id"], "name": row["name"],
                "email": row["email"], "created_at": row["created_at"]}
        self._ok({"user": user, "token": make_token(user["id"])})

    # -- cart --------------------------------------------------------------

    def _cart_rows(self, conn, user_id):
        return conn.execute(
            """SELECT ci.id, ci.product_id, ci.quantity,
                      p.name, p.description, p.price, p.category, p.image_url, p.stock
               FROM cart_items ci JOIN products p ON p.id = ci.product_id
               WHERE ci.user_id = ? ORDER BY ci.id""",
            (user_id,)).fetchall()

    def _api_cart_get(self):
        user_id = self._require_auth()
        with _db_lock:
            conn = get_db()
            rows = self._cart_rows(conn, user_id)
            conn.close()
        items = [row_to_dict(r) for r in rows]
        total = sum(i["price"] * i["quantity"] for i in items)
        self._ok({"items": items, "total": round(total, 2), "count": len(items)})

    def _api_cart_add(self):
        user_id = self._require_auth()
        body = self._read_json()
        try:
            product_id = int(body.get("product_id"))
        except (TypeError, ValueError):
            raise ApiError(400, "Field 'product_id' must be an integer")
        try:
            quantity = int(body.get("quantity", 1))
        except (TypeError, ValueError):
            raise ApiError(400, "Field 'quantity' must be an integer")
        if quantity <= 0:
            raise ApiError(400, "Field 'quantity' must be > 0")
        with _db_lock:
            conn = get_db()
            product = conn.execute("SELECT id, stock FROM products WHERE id = ?",
                                   (product_id,)).fetchone()
            if product is None:
                conn.close()
                raise ApiError(404, "Product not found")
            existing = conn.execute(
                "SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?",
                (user_id, product_id)).fetchone()
            new_qty = quantity + (existing["quantity"] if existing else 0)
            if new_qty > product["stock"]:
                conn.close()
                raise ApiError(400, f"Only {product['stock']} in stock")
            if existing:
                conn.execute("UPDATE cart_items SET quantity = ? WHERE id = ?",
                             (new_qty, existing["id"]))
                item_id = existing["id"]
            else:
                cur = conn.execute(
                    "INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)",
                    (user_id, product_id, quantity))
                item_id = cur.lastrowid
            conn.commit()
            row = conn.execute(
                """SELECT ci.id, ci.product_id, ci.quantity,
                          p.name, p.price, p.image_url
                   FROM cart_items ci JOIN products p ON p.id = ci.product_id
                   WHERE ci.id = ?""", (item_id,)).fetchone()
            conn.close()
        self._ok(row_to_dict(row), status=201)

    def _api_cart_update(self, item_id):
        user_id = self._require_auth()
        body = self._read_json()
        try:
            quantity = int(body.get("quantity"))
        except (TypeError, ValueError):
            raise ApiError(400, "Field 'quantity' must be an integer")
        with _db_lock:
            conn = get_db()
            item = conn.execute(
                "SELECT ci.id, ci.product_id, p.stock FROM cart_items ci"
                " JOIN products p ON p.id = ci.product_id"
                " WHERE ci.id = ? AND ci.user_id = ?", (item_id, user_id)).fetchone()
            if item is None:
                conn.close()
                raise ApiError(404, "Cart item not found")
            if quantity <= 0:
                conn.execute("DELETE FROM cart_items WHERE id = ?", (item_id,))
                conn.commit()
                conn.close()
                return self._ok({"deleted": True})
            if quantity > item["stock"]:
                conn.close()
                raise ApiError(400, f"Only {item['stock']} in stock")
            conn.execute("UPDATE cart_items SET quantity = ? WHERE id = ?", (quantity, item_id))
            conn.commit()
            row = conn.execute(
                """SELECT ci.id, ci.product_id, ci.quantity,
                          p.name, p.price, p.image_url
                   FROM cart_items ci JOIN products p ON p.id = ci.product_id
                   WHERE ci.id = ?""", (item_id,)).fetchone()
            conn.close()
        self._ok(row_to_dict(row))

    def _api_cart_delete(self, item_id):
        user_id = self._require_auth()
        with _db_lock:
            conn = get_db()
            cur = conn.execute("DELETE FROM cart_items WHERE id = ? AND user_id = ?",
                               (item_id, user_id))
            conn.commit()
            conn.close()
        if cur.rowcount == 0:
            raise ApiError(404, "Cart item not found")
        self._ok({"deleted": True})

    # -- checkout & orders ---------------------------------------------------

    def _api_checkout(self):
        user_id = self._require_auth()
        with _db_lock:
            conn = get_db()
            rows = self._cart_rows(conn, user_id)
            if not rows:
                conn.close()
                raise ApiError(400, "Cart is empty")
            for r in rows:
                if r["quantity"] > r["stock"]:
                    conn.close()
                    raise ApiError(400, f"Insufficient stock for '{r['name']}'")
            total = round(sum(r["price"] * r["quantity"] for r in rows), 2)
            cur = conn.execute(
                "INSERT INTO orders (user_id, total, status) VALUES (?, ?, 'placed')",
                (user_id, total))
            order_id = cur.lastrowid
            for r in rows:
                conn.execute(
                    "INSERT INTO order_items (order_id, product_id, quantity, price)"
                    " VALUES (?, ?, ?, ?)",
                    (order_id, r["product_id"], r["quantity"], r["price"]))
                conn.execute("UPDATE products SET stock = stock - ? WHERE id = ?",
                             (r["quantity"], r["product_id"]))
            conn.execute("DELETE FROM cart_items WHERE user_id = ?", (user_id,))
            conn.commit()
            order = row_to_dict(conn.execute(
                "SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone())
            items = [row_to_dict(r) for r in conn.execute(
                """SELECT oi.id, oi.product_id, oi.quantity, oi.price, p.name, p.image_url
                   FROM order_items oi JOIN products p ON p.id = oi.product_id
                   WHERE oi.order_id = ?""", (order_id,)).fetchall()]
            conn.close()
        order["items"] = items
        self._ok(order, status=201)

    def _api_orders_list(self):
        user_id = self._require_auth()
        with _db_lock:
            rows = get_db().execute(
                "SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC", (user_id,)).fetchall()
        self._ok([row_to_dict(r) for r in rows])

    def _api_order_get(self, order_id):
        user_id = self._require_auth()
        with _db_lock:
            conn = get_db()
            order = conn.execute("SELECT * FROM orders WHERE id = ? AND user_id = ?",
                                 (order_id, user_id)).fetchone()
            if order is None:
                conn.close()
                raise ApiError(404, "Order not found")
            items = [row_to_dict(r) for r in conn.execute(
                """SELECT oi.id, oi.product_id, oi.quantity, oi.price, p.name, p.image_url
                   FROM order_items oi JOIN products p ON p.id = oi.product_id
                   WHERE oi.order_id = ?""", (order_id,)).fetchall()]
            conn.close()
        data = row_to_dict(order)
        data["items"] = items
        self._ok(data)

    # -- static files ----------------------------------------------------------

    def _serve_static(self, path):
        rel = path.lstrip("/") or "index.html"
        if rel.endswith("/"):
            rel += "index.html"
        # prevent path traversal
        safe = os.path.normpath(rel)
        if safe.startswith("..") or os.path.isabs(safe):
            raise ApiError(403, "Forbidden")
        full = os.path.join(ROOT_DIR, safe)
        if os.path.isdir(full):
            full = os.path.join(full, "index.html")
        if not os.path.isfile(full):
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self._cors_headers()
            self.end_headers()
            self.wfile.write(b"<h1>404 - Not Found</h1>")
            return
        ctype, _ = mimetypes.guess_type(full)
        with open(full, "rb") as f:
            body = f.read()
        self.send_response(200)
        self.send_header("Content-Type", ctype or "application/octet-stream")
        self.send_header("Content-Length", str(len(body)))
        self._cors_headers()
        self.end_headers()
        self.wfile.write(body)

    # -- quieter logging --------------------------------------------------------

    def log_message(self, fmt, *args):
        if self.path == "/api/health":
            return
        print(f"[shopease] {self.address_string()} {self.command} {self.path}")


# ---------------------------------------------------------------- main

def main():
    import sys
    port = PORT
    for i, arg in enumerate(sys.argv):
        if arg == "--port" and i + 1 < len(sys.argv):
            port = int(sys.argv[i + 1])
    init_db()
    server = ThreadingHTTPServer(("127.0.0.1", port), ShopEaseHandler)
    print(f"[shopease] serving frontend from {ROOT_DIR}")
    print(f"[shopease] API + shop live at http://localhost:{port}/")
    print("[shopease] press Ctrl+C to stop")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[shopease] stopped")


if __name__ == "__main__":
    main()
