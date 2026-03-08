import fs from 'node:fs';
import path from 'node:path';

const HISTORY_FILE = path.resolve(process.cwd(), "history.json");

export default defineEventHandler((event) => {
    const id = getRouterParam(event, 'id');
    try {
        const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
        const item = history.find((h: any) => h.id === id);
        if (!item) throw createError({ statusCode: 404, statusMessage: "Bulunamadı" });
        return item;
    } catch (e) {
        throw createError({ statusCode: 404, statusMessage: "Hata" });
    }
});