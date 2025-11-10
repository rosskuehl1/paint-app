# PaintApp

PaintApp is a lightweight drawing playground built with React, Vite, and Nx. It mirrors familiar desktop paint tooling while staying fast enough to run entirely in the browser.

## 🚀 Live Demo

- 👉 [Launch the live demo](https://rosskuehl1.github.io/paint-app/) (hosted on GitHub Pages)
- Having trouble? Copy the link above into a new tab—GitHub strips inline embeds from README files, so the app must be opened directly.

## ✨ Features

### Drawing Tools
- **Pencil**: Precision drawing with adjustable size
- **Brush**: Smooth, blended strokes with Photoshop-like blending
- **Eraser**: Remove content with variable size
- **Rectangle Selection**: Create rectangular selections
- **Oval Selection**: Create elliptical selections

### Copy & Paste
- **Copy (Ctrl/Cmd+C)**: Copy selected region to clipboard
- **Cut (Ctrl/Cmd+X)**: Cut selected region (copy and clear)
- **Paste (Ctrl/Cmd+V)**: Paste copied content with live preview
- **Interactive Paste Mode**: See a transparent preview before placing
- **Visual Feedback**: Toast notifications for all clipboard operations

### How to Use Copy & Paste
1. Select a region using Rectangle or Oval selection tool
2. Press **Ctrl/Cmd+C** to copy or **Ctrl/Cmd+X** to cut
3. Press **Ctrl/Cmd+V** to enter paste mode
4. Move your mouse to see a preview of where the content will be pasted
5. Click to place the content, or press **Escape** to cancel
6. Use the toolbar buttons as an alternative to keyboard shortcuts
## 🧑‍💻 Local Development

```sh
npm install
npx nx serve paint-app
```

- The dev server runs on `http://localhost:5173/` by default.
- Use `npx nx build paint-app` for a production build and `npx nx test paint-app` to run the unit tests.

## 📦 Deployment

- Run `npm run deploy` to build the project and publish `dist/paint-app` to the `gh-pages` branch.
- The command wraps `nx deploy paint-app`, which uses `gh-pages` under the hood—ensure `git remote` access is configured (e.g., via GitHub CLI or SSH keys).

## 🛠 Tech Stack

- **React 18** with hooks for UI logic
- **Vite** for lightning-fast dev server and bundling
- **Nx** for task running, code generation, and consistent project structure
- **TypeScript** for type-safe components and utilities

## 🤝 Contributing

Issues and pull requests are welcome! If you plan to tackle a larger feature, please open an issue first so we can scope it together.

1. Fork the repository and create a branch off `main`.
2. Make your changes.
3. Run `npx nx format:write` and `npx nx test paint-app`.
4. Open a pull request describing your changes.

## � Funding

If you find PaintApp helpful, consider supporting ongoing development on [PayPal](https://paypal.me/rosskuehl).

## �📄 License

This project is released under the MIT License.
