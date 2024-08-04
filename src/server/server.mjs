import express from "express";
import sqlite3 from "better-sqlite3";
import axios from "axios";
import fs from "node:fs";
import { env } from "node:process";

const API_KEY = fs.readFileSync(env.API_KEY_FILE || "aqi_key");
const SOCKET = env.SOCKET || 3000;
const DB = env.DB || "aqi.db";
const MOUNT_POINT = env.MOUNT_POINT || "/";

function initDB() {
    const db = sqlite3(DB);
    db.pragma("journal_mode = WAL");
    return db;
}

function getDB(zip) {
    const db = initDB();
    const result = db
        .prepare(
            "SELECT * FROM observation WHERE zipcode = ? ORDER BY date DESC;"
        )
        .get(zip);
    if (result) {
        result.data = JSON.parse(result.data);
    }
    db.close();
    return result;
}

function storeData(zip, data) {
    const now = new Date();
    const date = new Date(now.getTime() + 15 * 60000).toISOString();
    const db = initDB();
    db.prepare("INSERT INTO observation VALUES (?, ?, ?);").run(
        zip,
        date,
        JSON.stringify(data)
    );
    db.close();
    return { zip, date, data };
}

async function getApi(zip) {
    const response = await axios.get(
        `https://www.airnowapi.org/aq/observation/zipCode/current/?format=application/json&zipCode=${zip}&distance=25&API_KEY=${API_KEY}`
    );
    if (response.status != 200) {
        throw { error: "Failed to communicate with API", status: 502 };
    }
    return storeData(zip, response.data);
}

(function setupDB() {
    const db = initDB();
    db.prepare(
        "CREATE TABLE IF NOT EXISTS observation (zipcode text, date text, data text);"
    ).run();
    db.close();
})();

const app = express();
const router = express.Router();

router.get("/", async (req, res) => {
    res.set({ "Access-Control-Allow-Origin": "*" });
    try {
        const zip = req.query?.zip;
        if (!zip) {
            throw { error: "Missing zip parameter", status: 400 };
        }
        if (!zip.match(/\d{5}/)) {
            throw { error: "Invalid format for zip code", status: 400 };
        }
        let data = getDB(zip);
        if (!data || new Date(data.date) < new Date()) {
            console.log(`Fetching data for ${zip} from API`);
            data = await getApi(zip);
        }
        res.json(data);
    } catch (e) {
        res.status(e.status).json(e);
    }
});

app.use(MOUNT_POINT, router);

app.listen(SOCKET, () => {
    console.log(`Listening for requests on ${MOUNT_POINT} on ${SOCKET}`);
});
