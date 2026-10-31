#!/usr/bin/env python3
"""
ShopEase E-Commerce - Database seed script (stdlib only)
=======================================================
Creates the tables (from schema.sql) and inserts 12 realistic
products with INR prices. Idempotent: skips when products exist
unless --force is passed.

Usage:
    python3 backend/seed.py
    python3 backend/seed.py --force     # wipe and re-seed products
"""

import os
import sqlite3
import sys

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BACKEND_DIR, "shopease.db")
SCHEMA_PATH = os.path.join(BACKEND_DIR, "schema.sql")

# NOTE: fashion products use the repo's real product photos under
# assets/images/products/ ; home & electronics use the shared placeholder
# (assets/images/products/placeholder.jpg) until real photos are added.
IMG = "assets/images/products/"
PH = IMG + "placeholder.jpg"

# (name, description, price_inr, category, image_url, stock)
PRODUCTS = [
    # ---- Fashion ------------------------------------------------------
    ("Men's Oversized Graphic T-Shirt",
     "Premium cotton oversized t-shirt with a modern relaxed fit. "
     "Breathable fabric, perfect for everyday streetwear.",
     899, "fashion", IMG + "mens-oversized-tshirt.jpg", 120),

    ("Classic Denim Jacket",
     "Classic blue denim jacket designed for everyday styling. "
     "Durable stitching, comfortable regular fit.",
     1899, "fashion", IMG + "classic-denim-jacket.jpg", 80),

    ("Slim Fit Casual Shirt",
     "Comfortable slim-fit shirt suitable for casual and semi-formal "
     "looks. Soft-touch cotton blend.",
     1199, "fashion", IMG + "slim-fit-shirt.jpg", 95),

    ("Genuine Leather Wallet",
     "Genuine leather bifold wallet with 8 card slots and 2 currency "
     "compartments. Sleek, durable finish.",
     899, "fashion", IMG + "leather-wallet.jpg", 150),

    # ---- Home ----------------------------------------------------------
    ("Ceramic Dinner Set (18 pcs)",
     "Elegant 18-piece ceramic dinner set for 6. Chip-resistant glaze, "
     "microwave and dishwasher safe.",
     1999, "home", PH, 40),

    ("LED Table Lamp",
     "Modern touch-control LED desk lamp with 3 brightness levels and a "
     "warm-to-cool colour range. USB powered.",
     749, "home", PH, 90),

    ("Cotton Bedsheet (King)",
     "220 TC pure cotton king-size bedsheet with 2 pillow covers. "
     "Soft, colour-fast and skin friendly.",
     999, "home", PH, 70),

    ("Stainless Steel Water Bottle 1L",
     "Double-wall vacuum insulated 1L bottle. Keeps drinks hot for 12 hrs "
     "or cold for 24 hrs. BPA free.",
     649, "home", PH, 200),

    # ---- Electronics ----------------------------------------------------
    ("Wireless Bluetooth Earbuds",
     "True wireless earbuds with 40-hour total battery, ENC noise "
     "reduction and low-latency gaming mode.",
     1799, "electronics", PH, 110),

    ("Smart Fitness Band",
     "Fitness band with heart-rate and SpO2 tracking, 14-day battery, "
     "100+ sport modes and 1.47-inch display.",
     2499, "electronics", PH, 75),

    ("Portable Bluetooth Speaker",
     "Compact Bluetooth speaker with deep bass, 18-hour playtime and "
     "IPX6 splash resistance.",
     1599, "electronics", PH, 65),

    ("USB-C Fast Charger 65W",
     "65W GaN fast charger with dual USB-C + USB-A ports. Charges "
     "laptops, phones and tablets at full speed.",
     1299, "electronics", PH, 130),
]


def main():
    force = "--force" in sys.argv
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        conn.executescript(f.read())

    existing = conn.execute("SELECT COUNT(*) FROM products").fetchone()[0]
    if existing and not force:
        print(f"[seed] {existing} products already in database - skipping (use --force to re-seed)")
        conn.close()
        return

    if force:
        conn.execute("DELETE FROM products")
        print("[seed] cleared existing products")

    conn.executemany(
        "INSERT INTO products (name, description, price, category, image_url, stock)"
        " VALUES (?, ?, ?, ?, ?, ?)",
        PRODUCTS,
    )
    conn.commit()
    count = conn.execute("SELECT COUNT(*) FROM products").fetchone()[0]
    conn.close()
    print(f"[seed] inserted {count} products into {DB_PATH}")


if __name__ == "__main__":
    main()
