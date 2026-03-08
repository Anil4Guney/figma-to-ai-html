<template>
  <div v-if="isLoading" class="loading-overlay">
    <div class="ai-spinner"></div>
    <div class="loading-content">
        <h3>Yapay Zeka Çalışıyor</h3>
        <p>Tasarımın koda dönüştürülüyor...</p>
    </div>
  </div>
  <div class="app-layout">
    
    <aside class="sidebar">
      <div class="sidebar-header">  
        <h2>AI Figma Converter</h2>
      </div>
      
      <div class="history-list">
        <div v-if="historyList.length === 0" class="empty-state">
          <i class="pi pi-folder-open" style="font-size: 2rem; margin-bottom: 10px;"></i>
          <p>Geçmiş boş.</p>
        </div>

        <div 
          v-for="item in historyList" 
          :key="item.id"
          class="history-item"
          :class="{ 'active': currentRecordId === item.id }"
          @click="loadHistoryItem(item.id)"
        >
          <div class="history-content">
             <div class="history-key" :title="item.fileKey">
                {{ item.fileKey.substring(0, 15) }}...
             </div>
             <div class="history-meta">
               <span class="history-time">{{ item.date.split(' ')[1] }}</span>
               <span class="history-tag" v-if="item.cssFileName !== 'No CSS'">CSS Var</span>
             </div>
          </div>

          <Button 
            icon="pi pi-trash" 
            text 
            rounded 
            severity="danger" 
            size="small"
            class="delete-btn"
            @click.stop="deleteHistoryItem(item.id)" 
          />
        </div>
      </div>
      
      <div class="sidebar-footer">
        <Button label="Yeni Proje" icon="pi pi-plus" class="full-width-btn" severity="info" @click="resetForm" />
      </div>
    </aside>

    <main class="main-content">
      <div class="content-wrapper">
        
        <div class="header-section">
            <h1 class="page-title">
               Figma to Code 
            </h1>
            <p class="subtitle">Figma tasarımlarınızı akıllıca HTML/CSS koduna dönüştürün.</p>
        </div>

        <div class="input-card">
          <div class="form-group css-upload-area">
            <label class="label-heading">
                 1. Global CSS (Opsiyonel)
            </label>
            <div class="file-upload-wrapper">
                <label class="file-btn" :class="{'file-selected': cssFileName}">
                    <i class="pi pi-upload"></i>
                    {{ cssFileName ? 'Dosya Değiştir' : 'main.css Yükle' }}
                    <input type="file" accept=".css" @change="handleFileUpload" style="display:none"/>
                </label>
                <div v-if="cssFileName" class="file-info">
                   <span class="file-name">{{ cssFileName }}</span>
                   <i class="pi pi-check-circle success-icon"></i>
                </div>
                <div v-else class="file-info empty">
                   Yüklü dosya yok (AI kendi stillerini oluşturacak)
                </div>
            </div>
          </div>

          <div class="divider"></div>

          <div class="form-row">
            <div class="form-col grow">
               <label class="label-heading"> 2. Figma File Key</label>
               <InputText v-model="fileKey" placeholder="figma.com/file/KEY/..." class="input-full" />
            </div>
            <div class="form-col small">
               <label class="label-heading"> Node ID</label>
               <InputText v-model="nodeId" placeholder="1:2" class="input-full" />
            </div>
            <div class="form-col btn-col">
               <Button label="Dönüştür"  severity="success" class="convert-btn" @click="convertFigma" :loading="isLoading" />
            </div>
          </div>
        </div>
        
        <div v-if="isLoading" class="loading-container">
            <div class="loader"></div>
            <h3>Yapay Zeka Çalışıyor...</h3>
            <p>Tasarım analiz ediliyor, CSS yapısı eşleştiriliyor.</p>
        </div>

        <div v-if="responseHtml && !isLoading" class="results-section">
          
          <div class="section-header">
             <h2><i class="pi pi-desktop"></i> Önizleme</h2>
             <Button label="Yeni Sekmede Aç" icon="pi pi-external-link" text size="small" @click="openPreviewInNewTab"/>
          </div>
          
          <div class="preview-box">
            <iframe :srcdoc="responseHtml"></iframe>
          </div>

          <div class="code-editor-container">
            <div class="editor-header">
              <div class="tabs">
                <button 
                  class="tab-btn" 
                  :class="{ active: activeTab === 'html' }"
                  @click="activeTab = 'html'"
                >
                  <i class="pi pi-code"></i> HTML
                </button>
                <button 
                  class="tab-btn" 
                  :class="{ active: activeTab === 'css' }"
                  @click="activeTab = 'css'"
                >
                  <i class="pi pi-palette"></i> CSS
                </button>
              </div>
              
              <div class="actions">
                <div class="edit-toggle">
                    <label class="switch">
                        <input type="checkbox" v-model="isEditMode">
                        <span class="slider round"></span>
                    </label>
                    <span class="toggle-label">Düzenle</span>
                </div>

                <Button 
                   v-if="isEditMode"
                   label="Uygula" 
                   icon="pi pi-play" 
                   size="small" 
                   class="apply-btn"
                   @click="applyChanges"
                />

                 <Button 
                   label="Kodu Kopyala" 
                   icon="pi pi-copy" 
                   text 
                   size="small" 
                   class="copy-btn-header"
                   @click="copyToClipboard(activeTab === 'html' ? (isEditMode ? editableHtml : responseCleanHtml) : (isEditMode ? editableCss : responseNewCss))" 
                 />
              </div>
            </div>

            <div class="editor-content">
              <div v-show="activeTab === 'html'" class="code-wrapper">
                <pre v-if="!isEditMode"><code class="language-html hljs" v-html="getHighlightedCode(responseCleanHtml || responseHtml, 'html')"></code></pre>
                <textarea v-else class="code-textarea" v-model="editableHtml" spellcheck="false"></textarea>
              </div>

              <div v-show="activeTab === 'css'" class="code-wrapper">
                <pre v-if="!isEditMode"><code class="language-css hljs" v-html="getHighlightedCode(responseNewCss, 'css')"></code></pre>
                <textarea v-else class="code-textarea" v-model="editableCss" spellcheck="false"></textarea>
              </div>
            </div>
          </div>
          </div>

      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, triggerRef } from "vue";
import Button from "primevue/button";
import InputText from "primevue/inputtext";

import hljs from "highlight.js";
import 'highlight.js/styles/atom-one-dark.css';


const loadingMessage = ref(' Yapay Zeka Tasarımı Kodluyor...'); 

const startLoading = () => {
    isLoading.value = true;
};

const stopLoading = () => {
    isLoading.value = false;
};

const getHighlightedCode = (code, lang) => {
    if (!code) return "";
    try {
        return hljs.highlight(code, { language: lang }).value;
    } catch (e) {
        console.error("Highlight hatası:", e);
        return code; 
    }
};

const activeTab = ref('html'); 

const fileKey = ref("");
const nodeId = ref("");
const isLoading = ref(false);
const historyList = ref([]);
const currentRecordId = ref(null);

const existingCssContent = ref(""); 
const cssFileName = ref("");

const responseHtml = ref("");
const responseCleanHtml = ref("");
const responseNewCss = ref("");

const isEditMode = ref(false); 
const editableHtml = ref("");  
const editableCss = ref("");   


const applyChanges = () => {
    const combinedHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
            /* --- SİGORTA KODLARI (Layout bozulmasını engeller) --- */
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Inter', sans-serif; background-color: #f4f4f4; }
            
            /* Eğer dosya yüklediyseniz o stilleri de koru */
            ${existingCssContent.value || ''}

            /* --- KULLANICININ EDİTÖRDEKİ KODLARI --- */
            ${editableCss.value}
        </style>
      </head>
      <body>
        ${editableHtml.value}
      </body>
      </html>
    `;

    responseHtml.value = combinedHtml;

    responseCleanHtml.value = editableHtml.value;
    responseNewCss.value = editableCss.value;
};

onMounted(async () => {
    await fetchHistory();
});

const fetchHistory = async () => {
    try {
        const res = await fetch("/api/history");
        historyList.value = await res.json();
    } catch (e) { console.error("Geçmiş yüklenemedi", e); }
};

const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    cssFileName.value = file.name;
    const reader = new FileReader();
    reader.onload = (e) => { existingCssContent.value = e.target.result; };
    reader.readAsText(file);
};

const resetForm = () => {
    currentRecordId.value = null;
    responseHtml.value = "";
    responseNewCss.value = "";
    fileKey.value = "";
    nodeId.value = "";
    activeTab.value = 'html'; 
};

const loadHistoryItem = async (id) => {
    try {
        isLoading.value = true;
        const res = await fetch(`/api/history/${id}`);
        const data = await res.json();
        
        currentRecordId.value = data.id;
        fileKey.value = data.fileKey;
        nodeId.value = data.nodeId || "";
        
        responseHtml.value = data.result.html;
        responseCleanHtml.value = data.result.cleanHtml || "";
        responseNewCss.value = data.result.newCss;

        editableHtml.value = data.result.cleanHtml || "";
        editableCss.value = data.result.newCss || "";
      

        
    } catch (e) { alert("Kayıt yüklenemedi."); } 
    finally { isLoading.value = false; }
};

const deleteHistoryItem = async (id) => {
    if(!confirm("Silinsin mi?")) return;
    try {
        const res = await fetch(`/api/history/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
            await fetchHistory();
            if (currentRecordId.value === id) resetForm();
        }
    } catch (e) { alert("Hata oluştu."); }
};

async function convertFigma() {
  if (!fileKey.value) { alert("Lütfen Figma File Key giriniz."); return; }
  
  isLoading.value = true;
  currentRecordId.value = null;
  responseHtml.value = ""; 

  try {
    const res = await fetch("/api/convert-figma", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileKey: fileKey.value,
        nodeId: nodeId.value,
        existingCss: existingCssContent.value,
        cssFileName: cssFileName.value 
      }),
    });

    const data = await res.json();
    if(data.error) throw new Error(data.error);

    responseHtml.value = data.html;
    responseCleanHtml.value = data.cleanHtml || "";
    responseNewCss.value = data.newCss;

    editableHtml.value = data.cleanHtml || "";
    editableCss.value = data.newCss || "";

    
    await fetchHistory();

  } catch (err) {
    alert("Hata: " + err.message);
  } finally {
    isLoading.value = false;
  }
}

function openPreviewInNewTab() {
    if(!responseHtml.value) return;
    const blob = new Blob([responseHtml.value], { type: 'text/html' });
    window.open(URL.createObjectURL(blob), '_blank');
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    
}

</script>

<style scoped>

.app-layout { display: flex; height: 100vh; background-color: #f8fafc; font-family: 'Inter', sans-serif; color: #334155; }
.sidebar { width: 300px; background: white; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; flex-shrink: 0; }
.sidebar-header { padding: 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; gap: 12px; }
.sidebar-header h2 { font-size: 1.1rem; font-weight: 700; margin: 0; color: #0f172a; }

.history-list { flex: 1; overflow-y: auto; padding: 1rem; }
.empty-state { text-align: center; color: #94a3b8; margin-top: 3rem; }
.history-item { background: white; padding: 12px; margin-bottom: 8px; border-radius: 8px; border: 1px solid #e2e8f0; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: all 0.2s; }
.history-item:hover { border-color: #cbd5e1; background: #f1f5f9; }
.history-item.active { border-color: #3b82f6; background: #eff6ff; }
.history-key { font-weight: 600; font-size: 0.85rem; color: #1e293b; margin-bottom: 4px; }
.history-meta { font-size: 0.75rem; color: #64748b; display: flex; gap: 8px; }
.history-tag { background: #dbeafe; color: #1e40af; padding: 1px 6px; border-radius: 4px; font-weight: 600; }
.delete-btn { opacity: 0; transition: opacity 0.2s; }
.history-item:hover .delete-btn { opacity: 1; }
.sidebar-footer { padding: 1.5rem; border-top: 1px solid #e2e8f0; }


.main-content { flex: 1; overflow-y: auto; padding: 2rem 3rem; position: relative; }
.content-wrapper { max-width: 1200px; margin: 0 auto; padding-bottom: 4rem; }


.header-section { text-align: center; margin-bottom: 2.5rem; }
.page-title { font-size: 2rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem; }
.subtitle { color: #64748b; font-size: 1.1rem; }
.input-card { background: white; border-radius: 16px; box-shadow: 0 4px 20px -5px rgba(0,0,0,0.05); padding: 2rem; border: 1px solid #e2e8f0; }
.label-heading { display: flex; align-items: center; gap: 8px; font-weight: 600; color: #334155; margin-bottom: 8px; font-size: 0.95rem; }
.file-upload-wrapper { display: flex; align-items: center; gap: 16px; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px dashed #cbd5e1; }
.file-btn { background: white; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 6px; font-size: 0.9rem; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
.file-btn:hover { background: #f1f5f9; border-color: #94a3b8; }
.file-selected { background: #dcfce7; border-color: #86efac; color: #166534; }
.file-info { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; }
.file-name { font-weight: 600; color: #0f172a; }
.success-icon { color: #16a34a; }
.empty { color: #94a3b8; font-style: italic; }
.divider { height: 1px; background: #e2e8f0; margin: 1.5rem 0; }
.form-row { display: flex; gap: 16px; align-items: flex-end; }
.form-col.grow { flex: 1; }
.form-col.small { width: 120px; }
.input-full { width: 100%; }
.convert-btn { width: 100%; font-weight: 600; }
.loading-container { text-align: center; padding: 3rem; }
.loader { border: 4px solid #f3f3f3; border-top: 4px solid #3b82f6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }


.results-section { animation: slideUp 0.5s ease; margin-top: 2rem; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }



.preview-box { 
    background: white; 
    border: 1px solid #e2e8f0; 
    border-radius: 12px; 
    height: 500px; 
    overflow: hidden; 
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); 
    margin-bottom: 2rem; 
}
.preview-box iframe { width: 100%; height: 100%; border: none; }


.code-editor-container {
  background: #1e1e1e; 
  border-radius: 12px;
  box-shadow: 0 10px 30px -10px rgba(0,0,0,0.4);
  overflow: hidden; 
  border: 1px solid #333;
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
}

.editor-header {
  background: #252526;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #1e1e1e;
  padding-right: 1rem;
  height: 45px;
}

.tabs { display: flex; height: 100%; }

.tab-btn {
  background: transparent;
  border: none;
  color: #969696;
  padding: 0 24px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  border-right: 1px solid #1e1e1e;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  height: 100%;
}

.tab-btn:hover { background: #2d2d2d; color: #e0e0e0; }

.tab-btn.active {
  background: #1e1e1e;
  color: #fff;
  border-top: 2px solid #3b82f6; 
}

.copy-btn-header { color: #fff !important; opacity: 0.7; }
.copy-btn-header:hover { opacity: 1; background: rgba(255,255,255,0.1) !important; }

.editor-content {
  position: relative;
  height: 400px; 
}

.code-wrapper {
  height: 100%;
  width: 100%;
  overflow: auto; 
  background: #1e1e1e;
}


pre {
  margin: 0;
  padding: 1.5rem;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #d4d4d4;
  white-space: pre; 
}

pre code.hljs {
  background: transparent;
  padding: 0;
}


.code-wrapper::-webkit-scrollbar { width: 10px; height: 10px; }
.code-wrapper::-webkit-scrollbar-track { background: #1e1e1e; }
.code-wrapper::-webkit-scrollbar-thumb { background: #424242; border-radius: 5px; border: 2px solid #1e1e1e; }
.code-wrapper::-webkit-scrollbar-thumb:hover { background: #4f4f4f; }

@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>
<style>
body, html {
    margin: 0 !important;
    padding: 0 !important;
    width: 100%;
    height: 100%;
    overflow: hidden;
    box-sizing: border-box;
}


.edit-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-right: 12px;
    border-right: 1px solid #3e3e3e;
    padding-right: 12px;
}

.toggle-label {
    color: #969696;
    font-size: 0.85rem;
    font-weight: 500;
}

.switch {
  position: relative;
  display: inline-block;
  width: 34px;
  height: 20px;
}

.switch input { 
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #424242;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
}

input:checked + .slider {
  background-color: #3b82f6;
}

input:checked + .slider:before {
  transform: translateX(14px);
}

.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}


.code-textarea {
    width: 100%;
    height: 100%;
    background-color: #1e1e1e; 
    color: #d4d4d4;
    border: none;
    resize: none;
    padding: 1.5rem;
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 14px;
    line-height: 1.6;
    outline: none;
    white-space: pre;
}

.code-textarea:focus {
    background-color: #252526; 
}

.apply-btn {
    margin-right: 8px;
    background-color: #16a34a !important;
    border: none;
}
.apply-btn:hover {
    background-color: #15803d !important;
}

.actions {
    display: flex;
    align-items: center;
}

/* --- LOADING EKRANI STİLLERİ --- */
.loading-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(5px);
    z-index: 9999;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
}

.ai-spinner {
    width: 60px; height: 60px;
    border-radius: 50%;
    background: conic-gradient(#3b82f6, #8b5cf6, #ec4899, #3b82f6);
    animation: spin 1.5s linear infinite;
    mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #fff 0);
    -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 4px), #fff 0);
    margin-bottom: 20px;
}

.loading-content h3 {
    font-size: 1.5rem; color: #1e293b; margin: 0 0 10px 0; font-weight: 700;
}
.loading-content p {
    font-size: 1.1rem; color: #64748b; font-weight: 500;
    animation: pulse 1s infinite alternate;
}

@keyframes spin { 100% { transform: rotate(360deg); } }
@keyframes pulse { from { opacity: 0.6; } to { opacity: 1; } }
</style>