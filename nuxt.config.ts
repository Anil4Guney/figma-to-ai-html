// nuxt.config.ts
import Aura from '@primevue/themes/aura';

export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  
  // PrimeVue modülünü ekliyoruz
  modules: [
    '@primevue/nuxt-module'
  ],
  
  // PrimeVue tema ayarları
  primevue: {
    options: {
        theme: {
            preset: Aura,
            options: {
                darkModeSelector: '.my-app-dark', // Dark modu manuel kontrol etmek için
            }
        }
    }
  },
  
  // İkon setini yüklüyoruz
  css: [
    'primeicons/primeicons.css'
  ]
})