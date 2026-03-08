import { GoogleGenerativeAI } from "@google/generative-ai";
import { v4 as uuidv4 } from 'uuid';
import fs from 'node:fs';
import path from 'node:path';
import { fetchFigmaData } from "../utils/figmaService";

const HISTORY_FILE = path.resolve(process.cwd(), "history.json");

const saveToHistory = (record: any) => {
    let history = [];
    try {
        if (fs.existsSync(HISTORY_FILE)) {
            history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
        }
    } catch (e) { history = []; }
    history.unshift(record);
    if (history.length > 20) history.pop();
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
};

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { fileKey, nodeId, existingCss, cssFileName } = body;

    if (!fileKey) throw createError({ statusCode: 400, statusMessage: "File Key Eksik" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw createError({ statusCode: 500, statusMessage: "API Key bulunamadı." });

    const genAI = new GoogleGenerativeAI(apiKey);
    
    const geminiModel = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview", 
        generationConfig: { 
            temperature: 0.2, 
        } 
    });

    try {
        console.log(` İşlem Başlıyor... File: ${fileKey}`);

        const figmaResult = await fetchFigmaData(fileKey, nodeId);
        const rawHtml = figmaResult.html; 
        const originalWidth = figmaResult.width;
        const originalHeight = figmaResult.height;

        if (!rawHtml) throw new Error("Figma verisi boş geldi.");

        console.log(` HTML Oluşturuluyor (Full Mode)...`);

        let htmlSystemInstruction = `
        Sen Yaratıcı Bir Yazar DEĞİLSİN. Sen Disiplinli Bir Kod Dönüştürme Motorusun.

        KESİN VE AŞILAMAZ KURALLAR (VERBOSITY RULES):
        1. **TEKRAR ETMEKTEN KORKMA (NO SUMMARIZATION):**
           - Veride birbirinin aynısı 20 tane "Kart" varsa, HTML çıktısında da 20 tane <div> bloğu olacak.
           - ASLA "Repeat x times", "..." veya "" yazma.
           - Bir listede 10 madde varsa 10'unu da yaz. Kodu kısaltmaya çalışma. Uzun kod senin başarın demektir.

        2. **GÖRSELLER VE İKONLAR:**
           - **İkonlar:** Eğer element bir ikon, ok, logo veya vektör ise; uygun 'FontAwesome 6' class'ı kullan (örn: <i class="fa-solid fa-user"></i>).
           - **Resimler:** Büyük fotoğraf alanları için: <img src="https://placehold.co/${Math.round(originalWidth/4)}x200?text=Img" alt="Görsel" class="img-fluid" /> kullan.
           - ASLA boş, anlamsız bir <div> bırakma.

        3. **YAPI VE SEMANTİK:**
           - <header>, <nav>, <main>, <section>, <footer> etiketlerini kullanarak Semantic HTML oluştur.
           - Class isimlerini BEM (Block Element Modifier) yapısına uygun ver.

        ÇIKTI FORMATI:
        Sadece HTML kod bloğu döndür (\`\`\`html ... \`\`\`).
        `;
        
        let htmlUserPrompt = `İŞLENECEK VERİ:\n${rawHtml}`;

        const htmlResult = await geminiModel.generateContent([htmlSystemInstruction, htmlUserPrompt]);
        let generatedHtml = htmlResult.response.text().replace(/```html/g, "").replace(/```/g, "").trim();

        console.log(` CSS Oluşturuluyor...`);

        let cssSystemInstruction = `
        Sen Kıdemli CSS Mühendisisin. HTML yapısına göre modern CSS yaz.

        LAYOUT KURALLARI (KAYMAYI ENGELLE):
        1. **POZİSYONLAMA (ABSOLUTE YASAĞI):**
           - Ana iskelet (layout) için ASLA 'position: absolute' kullanma.
           - SADECE Flexbox (display: flex, gap) veya Grid kullan.
           - 'position: absolute' sadece küçük rozetler (badges) için kullanılabilir.

        2. **GÖRÜNÜRLÜK GARANTİSİ:**
           - İçi boş ama arka plan rengi olan kutulara (dekoratif şekiller) mutlaka 'min-width' ve 'min-height' ver. Yoksa görünmezler.
           - Metinlerin taşmaması için 'word-break: break-word' ekle.

        3. **MODERN STİL:**
           - Renkleri :root değişkenlerinde tanımla.
           - Fontları ve renkleri orijinal veriden birebir al.

        ÇIKTI FORMATI:
        Sadece CSS kodu döndür (\`\`\`css ... \`\`\`).
        `;

        let cssUserPrompt = `
        HTML YAPISI:
        ${generatedHtml}
        
        ORİJİNAL VERİ REFERANSI:
        ${rawHtml.substring(0, 30000)}
        ${existingCss ? `NOT: Kullanıcının kendi CSS dosyası var. Sen sadece eksik kalan layout/pozisyon kodlarını tamamla.` : ''}
        `;

        const cssResult = await geminiModel.generateContent([cssSystemInstruction, cssUserPrompt]);
        let generatedCss = cssResult.response.text().replace(/```css/g, "").replace(/```/g, "").trim();

        const baseCss = `
        img { max-width: 100%; display: block; object-fit: cover; }
        .ai-placeholder {
            background-color: #e2e8f0; display: flex; align-items: center; justify-content: center;
            color: #64748b; font-weight: 600; border-radius: 8px; min-height: 50px;
        }
        i.fa-solid, i.fa-regular, i.fa-brands { font-size: 1.2em; color: inherit; }
        `;

        const finalStyle = `${baseCss}${existingCss ? `\n/* USER CSS */\n${existingCss}` : ''}\n/* AI CSS */\n${generatedCss}`;
        

        const finalHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <title>AI Preview - Gemini 3 Flash</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        :root { --bg-body: #f1f5f9; }
        body { 
            font-family: 'Inter', sans-serif; 
            background-color: var(--bg-body); 
            min-height: 100vh; 
            display: flex; 
            justify-content: center; 
            align-items: flex-start;
            padding: 40px; 
        }
        .preview-wrapper { 
            background: white; 
            width: 100%; 
            max-width: ${originalWidth}px; 
            min-height: ${originalHeight}px; 
            position: relative; 
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); 
            border-radius: 16px; 
            overflow: hidden; 
            display: flex; 
            flex-direction: column; 
        }
        ${finalStyle}
    </style>
</head>
<body>
    <div class="preview-wrapper">
        ${generatedHtml}
    </div>
</body>
</html>`;

        const record = {
            id: uuidv4(),
            date: new Date().toLocaleString("tr-TR"),
            fileKey, nodeId,
            cssFileName: cssFileName || (existingCss ? "Custom CSS" : "No CSS"),
            result: { html: finalHtml, cleanHtml: generatedHtml, newCss: generatedCss, existingCss }
        };

        saveToHistory(record);
        console.log(" İşlem Tamamlandı !");
        return record.result;

    } catch (error: any) {
        console.error(" HATA:", error.message);
        throw createError({ statusCode: 500, statusMessage: error.message || "Sunucu Hatası" });
    }
});