import fs from 'node:fs';
import path from 'node:path';

const HISTORY_FILE = path.resolve(process.cwd(), "history.json");

export default defineEventHandler((event) => {
    try {
        if (!fs.existsSync(HISTORY_FILE)) return [];
        return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
    } catch (e) {
        return [];
    }
});