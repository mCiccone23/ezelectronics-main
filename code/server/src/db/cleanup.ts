"use strict"

import db from "../db/db";

/**
 * Deletes all data from the database.
 * This function must be called before any integration test, to ensure a clean database state for each test run.
 */

export async function cleanup() : Promise<void> {
    const tables = ["productInCart", "reviews", "carts", "users", "products"];
    return new Promise((resolve, reject) => {
        let remaining = tables.length;

        tables.forEach(table => {
            db.run(`DELETE FROM ${table}`, (err) => {
                if (err) {
                    reject(err);
                }
                remaining--;
                if (remaining === 0) {
                    resolve();
                }
            });
        })
    })
}