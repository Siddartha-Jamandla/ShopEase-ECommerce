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

import error_bot  # local: automated error monitor + self-healing

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


def _ensure_column(conn, table, column, column_ddl):
    """Idempotent migration: ADD COLUMN when an existing DB predates it.

    init_db() runs schema.sql (all CREATE TABLE IF NOT EXISTS) on every
    startup, but that never adds columns to tables created by older
    schema versions — this fills that gap.
    """
    cols = [r["name"] for r in conn.execute(f"PRAGMA table_info({table})").fetchall()]
    if column not in cols:
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {column_ddl}")
        print(f"[shopease] migrated: added {table}.{column}")


def init_db():
    with _db_lock:
        conn = get_db()
        with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
            conn.executescript(f.read())
        # Backfill columns for DBs created before they existed in schema.sql.
        _ensure_column(conn, "products", "stock", "stock INTEGER NOT NULL DEFAULT 0")
        _ensure_column(conn, "products", "brand", "brand TEXT NOT NULL DEFAULT ''")
        _ensure_column(conn, "products", "old_price", "old_price REAL")
        _ensure_column(conn, "products", "rating", "rating REAL NOT NULL DEFAULT 0")
        _ensure_column(conn, "products", "reviews_count", "reviews_count INTEGER NOT NULL DEFAULT 0")
        _ensure_column(conn, "products", "badge", "badge TEXT NOT NULL DEFAULT ''")
        _ensure_column(conn, "orders", "status", "status TEXT NOT NULL DEFAULT 'placed'")
        _ensure_updated_at_column(conn)
        _backfill_status_history(conn)
        conn.commit()
        conn.close()
    print(f"[shopease] database ready at {DB_PATH}")
    try:
        error_bot.init_error_bot(DB_PATH)
    except Exception:
        pass


def _ensure_updated_at_column(conn):
    """Idempotent migration for orders.updated_at.

    SQLite forbids non-constant DEFAULTs in ALTER TABLE ADD COLUMN, so the
    column is added nullable and then backfilled from created_at.
    """
    cols = [r["name"] for r in conn.execute("PRAGMA table_info(orders)").fetchall()]
    if "updated_at" not in cols:
        conn.execute("ALTER TABLE orders ADD COLUMN updated_at TEXT")
        print("[shopease] migrated: added orders.updated_at")
    conn.execute("UPDATE orders SET updated_at = created_at WHERE updated_at IS NULL")


def _backfill_status_history(conn):
    """Seed order_status_history for orders that predate the table.

    Every order gets a 'placed' event at its created_at; orders whose current
    status differs also get an event for that status at updated_at.
    Runs once — skipped when the table already has rows.
    """
    n = conn.execute("SELECT COUNT(*) FROM order_status_history").fetchone()[0]
    if n:
        return
    for o in conn.execute(
            "SELECT id, status, created_at, COALESCE(updated_at, created_at) AS ts"
            " FROM orders").fetchall():
        conn.execute(
            "INSERT INTO order_status_history (order_id, status, changed_at)"
            " VALUES (?, 'placed', ?)", (o["id"], o["created_at"]))
        if o["status"] and o["status"] != "placed":
            conn.execute(
                "INSERT INTO order_status_history (order_id, status, changed_at)"
                " VALUES (?, ?, ?)", (o["id"], o["status"], o["ts"]))
    print("[shopease] backfilled order_status_history")


def _record_status_event(conn, order_id, status):
    """Append a status event and stamp orders.status/updated_at (call inside a
    transaction; the caller commits)."""
    conn.execute(
        "INSERT INTO order_status_history (order_id, status) VALUES (?, ?)",
        (order_id, status))
    conn.execute("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?",
                 (status, utcnow(), order_id))


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
                info = {"status": "ok", "time": utcnow()}
                try:
                    info["error_bot"] = error_bot.health_status()
                except Exception:
                    pass
                return self._ok(info)

            if path == "/api/errors" and method == "GET":
                # admin-only: needs ?key=ADMIN_KEY or Authorization header
                key = query.get("key", [""])[0] or self.headers.get("X-Admin-Key", "")
                if key != ADMIN_KEY:
                    raise ApiError(403, "Forbidden")
                try:
                    errs = error_bot.get_recent_errors(20)
                except Exception:
                    errs = []
                return self._ok({"errors": errs})

            if path == "/api/admin/stats" and method == "GET":
                return self._api_admin_stats(query)

            if path == "/api/products":
                if method == "GET":
                    return self._api_products_list(query)
                if method == "POST":
                    return self._api_products_create()
                raise ApiError(405, "Method not allowed")

            m = re.fullmatch(r"/api/products/(\d+)/reviews", path)
            if m:
                product_id = int(m.group(1))
                if method == "GET":
                    return self._api_reviews_list(product_id, query)
                if method == "POST":
                    return self._api_review_create(product_id)
                if method == "PUT":
                    return self._api_review_update(product_id)
                if method == "DELETE":
                    return self._api_review_delete(product_id)
                raise ApiError(405, "Method not allowed")

            m = re.fullmatch(r"/api/products/(\d+)", path)
            if m:
                if method == "GET":
                    return self._api_product_get(int(m.group(1)))
                if method == "PUT":
                    return self._api_product_update(int(m.group(1)))
                if method == "DELETE":
                    return self._api_product_delete(int(m.group(1)))
                raise ApiError(405, "Method not allowed")

            if path == "/api/register" and method == "POST":
                return self._api_register()
            if path == "/api/login" and method == "POST":
                return self._api_login()

            if path == "/api/me":
                if method == "GET":
                    return self._api_profile_get()
                if method == "PUT":
                    return self._api_profile_update()
                raise ApiError(405, "Method not allowed")

            if path == "/api/me/change-password" and method == "POST":
                return self._api_change_password()

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

            if path == "/api/wishlist":
                if method == "GET":
                    return self._api_wishlist_list()
                if method == "POST":
                    return self._api_wishlist_add()
                raise ApiError(405, "Method not allowed")

            m = re.fullmatch(r"/api/wishlist/(\d+)", path)
            if m and method == "DELETE":
                return self._api_wishlist_remove(int(m.group(1)))

            if path == "/api/orders" and method == "GET":
                return self._api_orders_list()

            m = re.fullmatch(r"/api/orders/(\d+)", path)
            if m and method == "GET":
                return self._api_order_get(int(m.group(1)))

            m = re.fullmatch(r"/api/orders/(\d+)/cancel", path)
            if m:
                if method == "POST":
                    return self._api_order_cancel(int(m.group(1)))
                raise ApiError(405, "Method not allowed")

            m = re.fullmatch(r"/api/orders/(\d+)/timeline", path)
            if m:
                if method == "GET":
                    return self._api_order_timeline(int(m.group(1)))
                raise ApiError(405, "Method not allowed")

            if path.startswith("/api/"):
                raise ApiError(404, "Unknown API endpoint")

            if method != "GET":
                raise ApiError(405, "Method not allowed")
            self._serve_static(path)

        except ApiError as e:
            self._fail(e.status, e.message)
        except BrokenPipeError:
            pass
        except Exception as e:  # error-bot: log + try self-heal, never leak tracebacks
            try:
                eid, fixed, action = error_bot.handle_exception(
                    e, path=self.path, method=method, reinit_db=init_db
                )
                print(f"[shopease] ERROR id={eid} fixed={fixed} {e!r} action={action}")
            except Exception:
                eid, fixed = 0, False
            msg = "Internal server error"
            if eid:
                msg += f" (ref #{eid})"
            if fixed:
                msg += " — auto-fix applied, please retry"
            self._fail(500, msg)

    # -- products ----------------------------------------------------------

    def _validate_product_fields(self, body, current):
        """Merge request body over the current product row and validate.

        Returns the merged field dict. Raises ApiError(400) on bad input.
        'current' is a dict of the existing product columns.
        """
        name = str(body.get("name", current.get("name", ""))).strip()
        description = str(body.get("description", current.get("description", "")))
        category = str(body.get("category", current.get("category", "general"))).strip() or "general"
        image_url = str(body.get("image_url", current.get("image_url", "")))
        if not name:
            raise ApiError(400, "Field 'name' is required and cannot be empty")
        if len(name) > 200:
            raise ApiError(400, "Field 'name' must be at most 200 characters")
        if len(description) > 10000:
            raise ApiError(400, "Field 'description' must be at most 10000 characters")
        if len(category) > 60:
            raise ApiError(400, "Field 'category' must be at most 60 characters")
        if len(image_url) > 2000:
            raise ApiError(400, "Field 'image_url' must be at most 2000 characters")
        if "price" in body or "price" not in current:
            try:
                price = float(body.get("price"))
            except (TypeError, ValueError):
                raise ApiError(400, "Field 'price' must be a number")
        else:
            price = current["price"]
        if price < 0:
            raise ApiError(400, "Field 'price' must be >= 0")
        if "stock" in body or "stock" not in current:
            try:
                stock = int(body.get("stock", 0))
            except (TypeError, ValueError):
                raise ApiError(400, "Field 'stock' must be an integer")
        else:
            stock = current["stock"]
        if stock < 0:
            raise ApiError(400, "Field 'stock' must be >= 0")
        return {
            "name": name, "description": description, "price": price,
            "category": category, "image_url": image_url, "stock": stock,
        }

    # Sort keys accepted by GET /api/products?sort=<key>. rating_* sorts use a
    # correlated subquery on the reviews table (unrated products sort last).
    _AVG_RATING_SQL = ("(SELECT AVG(rating) FROM reviews r"
                       " WHERE r.product_id = products.id)")
    _PRODUCT_SORTS = {
        "newest": "id DESC",
        "price_asc": "price ASC",
        "price_desc": "price DESC",
        "name_asc": "name COLLATE NOCASE ASC",
        "name_desc": "name COLLATE NOCASE DESC",
        "rating_desc": _AVG_RATING_SQL + " DESC",
        "rating_asc": _AVG_RATING_SQL + " IS NULL, " + _AVG_RATING_SQL + " ASC",
    }

    def _api_products_list(self, query):
        category = (query.get("category", [""])[0] or "").strip()
        # `q` is the documented param; `search` is kept as a legacy alias.
        search = (query.get("q", [""])[0] or query.get("search", [""])[0] or "").strip()
        sort = (query.get("sort", [""])[0] or "").strip().lower()
        page_raw = (query.get("page", [""])[0] or "").strip()
        per_page_raw = (query.get("per_page", [""])[0] or "").strip()
        paginate = bool(page_raw or per_page_raw or sort)

        if sort and sort not in self._PRODUCT_SORTS:
            raise ApiError(400, "Invalid 'sort'. Use one of: "
                               + ", ".join(sorted(self._PRODUCT_SORTS)))
        try:
            page = int(page_raw) if page_raw else 1
            per_page = int(per_page_raw) if per_page_raw else 20
        except ValueError:
            raise ApiError(400, "'page' and 'per_page' must be integers")
        if page < 1:
            raise ApiError(400, "'page' must be >= 1")
        if not 1 <= per_page <= 100:
            raise ApiError(400, "'per_page' must be between 1 and 100")

        sql = "SELECT * FROM products"
        clauses, params = [], []
        if category:
            clauses.append("category = ?")
            params.append(category)
        if search:
            clauses.append("(name LIKE ? OR description LIKE ?)")
            params += [f"%{search}%", f"%{search}%"]
        where = (" WHERE " + " AND ".join(clauses)) if clauses else ""
        sql += where + " ORDER BY " + (self._PRODUCT_SORTS[sort] if sort else "id")

        with _db_lock:
            conn = get_db()
            if not paginate:
                # Backwards compatible: plain product array, as before.
                rows = conn.execute(sql, params).fetchall()
                conn.close()
                return self._ok([row_to_dict(r) for r in rows])
            total = conn.execute(
                "SELECT COUNT(*) FROM products" + where, params).fetchone()[0]
            offset = (page - 1) * per_page
            rows = conn.execute(
                sql + " LIMIT ? OFFSET ?", params + [per_page, offset]).fetchall()
            conn.close()
        total_pages = (total + per_page - 1) // per_page
        self._ok({"items": [row_to_dict(r) for r in rows], "page": page,
                  "per_page": per_page, "total": total,
                  "total_pages": total_pages})

    def _api_product_get(self, product_id):
        with _db_lock:
            row = get_db().execute(
                """SELECT p.*,
                          (SELECT ROUND(AVG(rating), 2) FROM reviews
                           WHERE product_id = p.id) AS average_rating,
                          (SELECT COUNT(*) FROM reviews
                           WHERE product_id = p.id) AS review_count
                   FROM products p WHERE p.id = ?""", (product_id,)).fetchone()
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
        if len(name) > 200:
            raise ApiError(400, "Field 'name' must be at most 200 characters")
        if len(description) > 10000:
            raise ApiError(400, "Field 'description' must be at most 10000 characters")
        if len(category) > 60:
            raise ApiError(400, "Field 'category' must be at most 60 characters")
        if len(image_url) > 2000:
            raise ApiError(400, "Field 'image_url' must be at most 2000 characters")
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

    def _api_product_update(self, product_id):
        if self.headers.get("X-Admin-Key", "") != ADMIN_KEY:
            raise ApiError(403, "Admin key required (X-Admin-Key header)")
        body = self._read_json()
        with _db_lock:
            conn = get_db()
            row = conn.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
            conn.close()
        if row is None:
            raise ApiError(404, "Product not found")
        fields = self._validate_product_fields(body, row_to_dict(row))
        with _db_lock:
            conn = get_db()
            conn.execute(
                "UPDATE products SET name = ?, description = ?, price = ?,"
                " category = ?, image_url = ?, stock = ? WHERE id = ?",
                (fields["name"], fields["description"], fields["price"],
                 fields["category"], fields["image_url"], fields["stock"], product_id),
            )
            conn.commit()
            updated = row_to_dict(conn.execute(
                "SELECT * FROM products WHERE id = ?", (product_id,)).fetchone())
            conn.close()
        self._ok(updated)

    def _api_product_delete(self, product_id):
        if self.headers.get("X-Admin-Key", "") != ADMIN_KEY:
            raise ApiError(403, "Admin key required (X-Admin-Key header)")
        with _db_lock:
            conn = get_db()
            row = conn.execute(
                "SELECT id, name FROM products WHERE id = ?", (product_id,)).fetchone()
            if row is None:
                conn.close()
                raise ApiError(404, "Product not found")
            # Never delete a product that appears in a past order: the order
            # history (with its price snapshots) must stay intact.
            ordered = conn.execute(
                "SELECT 1 FROM order_items WHERE product_id = ? LIMIT 1",
                (product_id,)).fetchone()
            if ordered is not None:
                conn.close()
                raise ApiError(409, "Cannot delete: product is referenced in past orders")
            # cart_items cascade automatically (ON DELETE CASCADE in schema).
            try:
                conn.execute("DELETE FROM products WHERE id = ?", (product_id,))
                conn.commit()
            except sqlite3.IntegrityError:
                conn.close()
                raise ApiError(409, "Cannot delete: product is still referenced elsewhere")
            conn.close()
        self._ok({"deleted": True, "id": product_id, "name": row["name"]})

    # -- reviews -------------------------------------------------------------

    def _validate_review_fields(self, body):
        """Validate a review body. Returns {'rating','title','comment'}."""
        try:
            rating = int(body.get("rating"))
        except (TypeError, ValueError):
            raise ApiError(400, "Field 'rating' must be an integer from 1 to 5")
        if not 1 <= rating <= 5:
            raise ApiError(400, "Field 'rating' must be between 1 and 5")
        title = str(body.get("title", "")).strip()
        comment = str(body.get("comment", "")).strip()
        if len(title) > 120:
            raise ApiError(400, "Field 'title' must be at most 120 characters")
        if len(comment) > 2000:
            raise ApiError(400, "Field 'comment' must be at most 2000 characters")
        return {"rating": rating, "title": title, "comment": comment}

    def _require_product(self, conn, product_id):
        """Raise ApiError(404) when the product is missing (closes conn first)."""
        row = conn.execute("SELECT id FROM products WHERE id = ?",
                           (product_id,)).fetchone()
        if row is None:
            conn.close()
            raise ApiError(404, "Product not found")

    def _api_reviews_list(self, product_id, query):
        try:
            page = int((query.get("page", [""])[0] or "").strip() or 1)
            per_page = int((query.get("per_page", [""])[0] or "").strip() or 20)
        except ValueError:
            raise ApiError(400, "'page' and 'per_page' must be integers")
        if page < 1:
            raise ApiError(400, "'page' must be >= 1")
        if not 1 <= per_page <= 100:
            raise ApiError(400, "'per_page' must be between 1 and 100")
        with _db_lock:
            conn = get_db()
            if conn.execute("SELECT id FROM products WHERE id = ?",
                            (product_id,)).fetchone() is None:
                conn.close()
                raise ApiError(404, "Product not found")
            total = conn.execute("SELECT COUNT(*) FROM reviews WHERE product_id = ?",
                                 (product_id,)).fetchone()[0]
            rows = conn.execute(
                """SELECT r.id, r.user_id, r.product_id, r.rating, r.title,
                          r.comment, r.created_at, u.name AS user_name
                   FROM reviews r JOIN users u ON u.id = r.user_id
                   WHERE r.product_id = ? ORDER BY r.id DESC
                   LIMIT ? OFFSET ?""",
                (product_id, per_page, (page - 1) * per_page)).fetchall()
            avg = conn.execute("SELECT ROUND(AVG(rating), 2) FROM reviews"
                               " WHERE product_id = ?", (product_id,)).fetchone()[0]
            conn.close()
        self._ok({"items": [row_to_dict(r) for r in rows], "page": page,
                  "per_page": per_page, "total": total,
                  "total_pages": (total + per_page - 1) // per_page,
                  "average_rating": avg})

    def _api_review_create(self, product_id):
        user_id = self._require_auth()
        fields = self._validate_review_fields(self._read_json())
        with _db_lock:
            conn = get_db()
            self._require_product(conn, product_id)
            if conn.execute("SELECT id FROM reviews WHERE user_id = ? AND product_id = ?",
                            (user_id, product_id)).fetchone():
                conn.close()
                raise ApiError(409, "You have already reviewed this product"
                                    " (use PUT to update your review)")
            cur = conn.execute(
                "INSERT INTO reviews (user_id, product_id, rating, title, comment)"
                " VALUES (?, ?, ?, ?, ?)",
                (user_id, product_id, fields["rating"], fields["title"], fields["comment"]))
            conn.commit()
            row = conn.execute("SELECT * FROM reviews WHERE id = ?",
                               (cur.lastrowid,)).fetchone()
            conn.close()
        self._ok(row_to_dict(row), status=201)

    def _api_review_update(self, product_id):
        user_id = self._require_auth()
        fields = self._validate_review_fields(self._read_json())
        with _db_lock:
            conn = get_db()
            self._require_product(conn, product_id)
            cur = conn.execute(
                "UPDATE reviews SET rating = ?, title = ?, comment = ?"
                " WHERE user_id = ? AND product_id = ?",
                (fields["rating"], fields["title"], fields["comment"], user_id, product_id))
            conn.commit()
            row = conn.execute("SELECT * FROM reviews WHERE user_id = ? AND product_id = ?",
                               (user_id, product_id)).fetchone()
            conn.close()
        if row is None:
            raise ApiError(404, "Review not found (you have not reviewed this product)")
        self._ok(row_to_dict(row))

    def _api_review_delete(self, product_id):
        user_id = self._require_auth()
        with _db_lock:
            conn = get_db()
            cur = conn.execute("DELETE FROM reviews WHERE user_id = ? AND product_id = ?",
                               (user_id, product_id))
            conn.commit()
            conn.close()
        if cur.rowcount == 0:
            raise ApiError(404, "Review not found (you have not reviewed this product)")
        self._ok({"deleted": True})

    # -- wishlist ------------------------------------------------------------

    def _api_wishlist_list(self):
        user_id = self._require_auth()
        with _db_lock:
            rows = get_db().execute(
                """SELECT w.id, w.product_id, w.created_at AS added_at,
                          p.name, p.description, p.price, p.category,
                          p.image_url, p.stock,
                          (SELECT ROUND(AVG(rating), 2) FROM reviews
                           WHERE product_id = p.id) AS average_rating,
                          (SELECT COUNT(*) FROM reviews
                           WHERE product_id = p.id) AS review_count
                   FROM wishlist w JOIN products p ON p.id = w.product_id
                   WHERE w.user_id = ? ORDER BY w.id DESC""",
                (user_id,)).fetchall()
        self._ok([row_to_dict(r) for r in rows])

    def _api_wishlist_add(self):
        user_id = self._require_auth()
        body = self._read_json()
        try:
            product_id = int(body.get("product_id"))
        except (TypeError, ValueError):
            raise ApiError(400, "Field 'product_id' must be an integer")
        if product_id <= 0:
            raise ApiError(400, "Field 'product_id' must be a positive integer")
        with _db_lock:
            conn = get_db()
            self._require_product(conn, product_id)
            try:
                conn.execute(
                    "INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)",
                    (user_id, product_id))
                conn.commit()
                added = True
                status = 201
            except sqlite3.IntegrityError:
                # Already wishlisted: idempotent, not an error.
                added = False
                status = 200
            row = conn.execute(
                """SELECT w.id, w.product_id, w.created_at AS added_at,
                          p.name, p.price, p.image_url, p.stock
                   FROM wishlist w JOIN products p ON p.id = w.product_id
                   WHERE w.user_id = ? AND w.product_id = ?""",
                (user_id, product_id)).fetchone()
            conn.close()
        item = row_to_dict(row)
        item["added"] = added
        self._ok(item, status=status)

    def _api_wishlist_remove(self, product_id):
        user_id = self._require_auth()
        with _db_lock:
            conn = get_db()
            cur = conn.execute(
                "DELETE FROM wishlist WHERE user_id = ? AND product_id = ?",
                (user_id, product_id))
            conn.commit()
            conn.close()
        if cur.rowcount == 0:
            raise ApiError(404, "Product is not in your wishlist")
        self._ok({"deleted": True, "product_id": product_id})

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
        if len(name) > 100:
            raise ApiError(400, "Field 'name' must be at most 100 characters")
        if len(password) < 6:
            raise ApiError(400, "Password must be at least 6 characters")
        if len(password) > 128:
            raise ApiError(400, "Password must be at most 128 characters")
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

    # -- profile -----------------------------------------------------------

    def _api_profile_get(self):
        user_id = self._require_auth()
        with _db_lock:
            conn = get_db()
            user = row_to_dict(conn.execute(
                "SELECT id, name, email, created_at FROM users WHERE id = ?",
                (user_id,)).fetchone())
            conn.close()
        if user is None:
            raise ApiError(404, "User not found")
        self._ok({"user": user})

    def _api_profile_update(self):
        user_id = self._require_auth()
        body = self._read_json()
        name = str(body.get("name", "")).strip()
        email = str(body.get("email", "")).strip().lower()
        if not name:
            raise ApiError(400, "Field 'name' is required and cannot be empty")
        if len(name) > 100:
            raise ApiError(400, "Field 'name' must be at most 100 characters")
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email or ""):
            raise ApiError(400, "A valid 'email' is required")
        with _db_lock:
            conn = get_db()
            clash = conn.execute(
                "SELECT id FROM users WHERE email = ? AND id != ?",
                (email, user_id)).fetchone()
            if clash:
                conn.close()
                raise ApiError(409, "An account with this email already exists")
            conn.execute("UPDATE users SET name = ?, email = ? WHERE id = ?",
                         (name, email, user_id))
            conn.commit()
            user = row_to_dict(conn.execute(
                "SELECT id, name, email, created_at FROM users WHERE id = ?",
                (user_id,)).fetchone())
            conn.close()
        self._ok({"user": user})

    def _api_change_password(self):
        user_id = self._require_auth()
        body = self._read_json()
        current = str(body.get("current_password", ""))
        new = str(body.get("new_password", ""))
        if not current or not new:
            raise ApiError(400, "Fields 'current_password' and 'new_password' are required")
        if len(new) < 6:
            raise ApiError(400, "New password must be at least 6 characters")
        if len(new) > 128:
            raise ApiError(400, "New password must be at most 128 characters")
        with _db_lock:
            conn = get_db()
            row = conn.execute("SELECT password_hash FROM users WHERE id = ?",
                               (user_id,)).fetchone()
            if row is None or not verify_password(current, row["password_hash"]):
                conn.close()
                raise ApiError(401, "Current password is incorrect")
            conn.execute("UPDATE users SET password_hash = ? WHERE id = ?",
                         (hash_password(new), user_id))
            conn.commit()
            conn.close()
        self._ok({"message": "Password changed successfully"})

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
        if product_id <= 0:
            raise ApiError(400, "Field 'product_id' must be a positive integer")
        try:
            quantity = int(body.get("quantity", 1))
        except (TypeError, ValueError):
            raise ApiError(400, "Field 'quantity' must be an integer")
        if quantity <= 0:
            raise ApiError(400, "Field 'quantity' must be > 0")
        if quantity > 99:
            raise ApiError(400, "Field 'quantity' must be at most 99")
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
        if quantity > 99:
            raise ApiError(400, "Field 'quantity' must be at most 99")
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
            conn.execute(
                "INSERT INTO order_status_history (order_id, status) VALUES (?, 'placed')",
                (order_id,))
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

    def _api_order_cancel(self, order_id):
        """Cancel the caller's own order while it is still 'placed'.

        Restores product stock from the order's items and records a
        'cancelled' status event. 401 unauthenticated, 403 another user's
        order, 404 missing order, 409 already shipped/delivered/cancelled.
        """
        user_id = self._require_auth()
        with _db_lock:
            conn = get_db()
            order = conn.execute(
                "SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
            if order is None:
                conn.close()
                raise ApiError(404, "Order not found")
            if order["user_id"] != user_id:
                conn.close()
                raise ApiError(403, "Not your order")
            if order["status"] != "placed":
                conn.close()
                raise ApiError(
                    409, f"Order is already '{order['status']}' and cannot be cancelled")
            for it in conn.execute(
                    "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
                    (order_id,)).fetchall():
                conn.execute("UPDATE products SET stock = stock + ? WHERE id = ?",
                             (it["quantity"], it["product_id"]))
            _record_status_event(conn, order_id, "cancelled")
            conn.commit()
            updated = row_to_dict(conn.execute(
                "SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone())
            conn.close()
        self._ok(updated)

    def _api_order_timeline(self, order_id):
        """Status timeline for the caller's own order.

        Returns the current status, the recorded status events (oldest first)
        and the stage list placed → shipped → delivered (or placed →
        cancelled) with reached flags and timestamps. 401 unauthenticated,
        403 another user's order, 404 missing order.
        """
        user_id = self._require_auth()
        with _db_lock:
            conn = get_db()
            order = conn.execute(
                "SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
            if order is None:
                conn.close()
                raise ApiError(404, "Order not found")
            if order["user_id"] != user_id:
                conn.close()
                raise ApiError(403, "Not your order")
            events = [row_to_dict(r) for r in conn.execute(
                "SELECT status, changed_at FROM order_status_history"
                " WHERE order_id = ? ORDER BY id", (order_id,)).fetchall()]
            conn.close()
        current = order["status"]
        stages = (["placed", "cancelled"] if current == "cancelled"
                  else ["placed", "shipped", "delivered"])
        first_at = {}
        for e in events:
            first_at.setdefault(e["status"], e["changed_at"])
        self._ok({
            "order_id": order_id,
            "current_status": current,
            "events": events,
            "stages": [{"status": s, "reached": s in first_at,
                        "at": first_at.get(s)} for s in stages],
        })

    def _api_admin_stats(self, query):
        """Store-wide stats for the admin dashboard.

        Same key auth as /api/errors: ?key=<ADMIN_KEY> or X-Admin-Key header.
        Returns total revenue (non-cancelled orders), order counts by status,
        top 10 products by units sold (with gross revenue) and the user count.
        """
        key = query.get("key", [""])[0] or self.headers.get("X-Admin-Key", "")
        if key != ADMIN_KEY:
            raise ApiError(403, "Forbidden")
        with _db_lock:
            conn = get_db()
            total_revenue = conn.execute(
                "SELECT COALESCE(SUM(total), 0) FROM orders WHERE status != 'cancelled'"
            ).fetchone()[0]
            orders_by_status = {
                r["status"]: r["n"] for r in conn.execute(
                    "SELECT status, COUNT(*) AS n FROM orders GROUP BY status").fetchall()
            }
            top_products = [row_to_dict(r) for r in conn.execute(
                """SELECT p.id, p.name,
                          SUM(oi.quantity) AS units_sold,
                          ROUND(SUM(oi.quantity * oi.price), 2) AS gross_revenue
                   FROM order_items oi
                   JOIN orders o ON o.id = oi.order_id
                   JOIN products p ON p.id = oi.product_id
                   WHERE o.status != 'cancelled'
                   GROUP BY p.id, p.name
                   ORDER BY units_sold DESC
                   LIMIT 10""").fetchall()]
            user_count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
            conn.close()
        self._ok({
            "total_revenue": round(total_revenue or 0, 2),
            "orders_by_status": orders_by_status,
            "top_products": top_products,
            "user_count": user_count,
        })

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
            # Serve the branded 404 page when it exists.
            not_found = os.path.join(ROOT_DIR, "404.html")
            if os.path.isfile(not_found):
                with open(not_found, "rb") as f:
                    body = f.read()
                self.send_response(404)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self._cors_headers()
                self.end_headers()
                self.wfile.write(body)
                return
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
