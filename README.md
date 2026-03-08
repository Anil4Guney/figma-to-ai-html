# Figma To AI-HTML Converter ➡️💻

A powerful, multi-layered tool that bridges the gap between design and development. It seamlessly converts Figma designs into clean, pixel-perfect HTML and CSS code while intelligently respecting your project's existing design system.

##  Demo

> **Note:** Watch the tool generate a pixel-perfect  component in seconds!



https://github.com/user-attachments/assets/c94300d8-eb4b-46bd-8fe0-8cf142934d0e



##  How It Works

The magic happens in four simple steps:

1. **Connect Figma:** Input your Figma File Key and Node ID.
2. **Provide Context (The Smart Part):** Upload your project's existing global CSS (e.g., `main.css`).
3. **AI Processing:** Our custom MCP Server perfectly extracts structural and styling data from Figma. The AI then cross-references this data with your uploaded CSS.
4. **Render & Export:** It prioritizes your existing CSS classes and only generates *new* code for missing elements. The result is immediately rendered in a live preview.

##  Key Features

* **Smart CSS Integration:** Upload your global CSS files. The AI analyzes your existing variables/classes, preventing code bloat and ensuring the output matches your current design system.
* **Pixel-Perfect Accuracy:** Advanced handling of complex layouts, custom fonts, and accurate shadow support.
* **Live Preview:** Instantly see your rendered HTML/CSS output exactly as it will appear in the browser.
* **Intelligent Placeholders:** Automatically generates robust visual placeholders (gray circles/rectangles) for missing icons and images.
* **History Management:** Keeps track of your previous conversions and AI prompts for easy access and reuse.
* **Full Localization Support:** Flawlessly handles complex typography and language-specific characters (like Turkish).

##  Architecture

This project is built on a robust three-part architecture to ensure scalability and speed:
* **Frontend:** Built with Nuxt.js (Vue Framework) for a highly reactive, smooth user interface.
* **Backend Server:** Manages AI orchestration, request routing, and history management.
* **MCP Server:** A dedicated server specifically built for precise Figma data extraction and structural processing.

