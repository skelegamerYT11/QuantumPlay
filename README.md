# 🎮 QuantumPlay

> A premium, modern, and ultra-fast universal game launcher built with Electron, React, and TypeScript. Vibe Coded with 💖 by MrSkele & Antigravity.

---

<p align="center">
  <img src="src/assets/app_logo.png" alt="QuantumPlay Logo" width="200" style="border-radius: 20px; box-shadow: 0 8px 30px rgba(0,0,0,0.5);" />
</p>

<p align="center">
  <strong>QuantumPlay</strong> is a lightweight, universal game launcher designed to gather all your video games into a single, beautiful, and interactive library. It automatically detects games installed across multiple launchers (Steam, Epic Games, Ubisoft Connect, Rockstar Games, GOG Galaxy) and offers complete control with a fully customizable interface, smooth animations, and a premium <em>Glassmorphic</em> design system.
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-installation">Installation</a> •
  <a href="#%EF%B8%8F-development">Development</a>
</p>

---

## ✨ Features

* 🚀 **Auto-Launcher Scanning**: Instantly detects installed games on your PC from **Steam, Epic Games, Rockstar Games, GOG Galaxy, and Ubisoft Connect**, retrieving stats like play time and last played date.
* ➕ **Manual Game Adding with Covers**: Add any custom game, application, or executable. Select a custom image for the game cover and background details page.
* 📁 **Drag & Drop Custom Categories**: Create custom categories just like on Steam! Drag and drop games into categories in the sidebar to organize them. Right-click any game inside a category to remove it instantly.
* 💖 **Favorites & Heart Animation**: Add your favorite games with a single click! The system highlights the heart icon in pink/fuchsia and adds an elegant star next to the title in the sidebar.
* 🎯 **Running Game Controller**: When you start a game, QuantumPlay monitors it. If you decide to end the session, instead of the "Running" state, you will find a prominent **red "Close Game" button** to force-terminate the process instantly.
* 🎨 **HSL Design System & Persistent Themes**: Choose from stunning pre-built themes (Dark, Light, Cyberpunk, Forest, Deep Ocean) or create your own custom theme by adjusting gradient colors, texts, and RGB accents. Prefered colors are saved permanently in the database.
* 🔒 **Single Instance Lock**: Prevents multiple instances of the app from running in the background. If you try to open the app again, the current instance is automatically shown and focused on the screen.
* ⚙️ **Minimize to Tray on Close**: Close the window to the System Tray (near the clock) to keep it active in the background without wasting system UI resources.
* 🗑️ **Clean Uninstaller with Custom Dialog**: Securely uninstall the application with a built-in option to completely clear all user data, game databases, stats, and themes stored in `%AppData%/QuantumPlay`.

---

## 🛠️ Tech Stack

* **Core**: [Electron](https://www.electronjs.org/) & [Node.js](https://nodejs.org/)
* **Frontend**: [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/)
* **Build Tool**: [Vite](https://vite.dev/) & [Vite-Plugin-Electron](https://github.com/electron-vite/vite-plugin-electron)
* **Styling**: Vanilla CSS with dynamic HSL variables, *Glassmorphic* (Backdrop-filter) effects, and CSS3 animations.
* **Database**: Local JSON database written asynchronously for maximum read/write performance.

---

## 📦 Installation

You can download or build the final executable packages for Windows in the `dist-release/` folder:

1. **`QuantumPlay Setup 1.0.0.exe`**: The standard Windows installer package to set up the launcher permanently on your system with Desktop and Start Menu shortcuts.
2. **`QuantumPlay 1.0.0.exe`**: The standalone portable release that requires no installation and runs instantly with a double click!

---

## ⚙️ Development and Local Compiling

To clone the source code, run QuantumPlay in development mode, or package it:

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+ recommended)
* npm (comes with Node.js)

### 1. Clone the repository and install dependencies
```bash
git clone https://github.com/your-username/QuantumPlay.git
cd QuantumPlay
npm install
```

### 2. Run in Development Mode (with Hot-Reloading)
```bash
npm run dev
```

### 3. Compile for production (Setup & Portable exes)
```bash
npm run build
```
All packaged files with the official custom logo will be located in the `dist-release/` directory.

---

## 👥 Contributors & Credits

* **MrSkele** ([@skelegamerYT11](https://github.com/skelegamerYT11)) — Creator, Designer & Lead Developer 👑
* **Antigravity** — AI Pair-Programmer & Software Architect ⚡ (Designed by the Google DeepMind Team)

---

<p align="center">
  Vibe Coded with 💖 by MrSkele & Antigravity
</p>
