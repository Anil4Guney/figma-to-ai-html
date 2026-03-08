import fs from 'node:fs';
import path from 'node:path';

const HISTORY_FILE = path.resolve(process.cwd(), "history.json");

export default defineEventHandler((event) => {
    const id = getRouterParam(event, 'id');
    try {
        let history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
        const initialLength = history.length;
        history = history.filter((h: any) => h.id !== id);
        
        if (history.length < initialLength) {
            fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
            return { success: true };
        } else {
            throw createError({ statusCode: 404, statusMessage: "Silinemedi" });
        }
    } catch (e) {
        return { success: false };
    }
});