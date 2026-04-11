# REV Fire & Security Solutions

A premium static company website for **Rev Fire & Security Solutions**, built with HTML, CSS, JavaScript, and Three.js.

The site is designed to present a modern fire and security brand with a cinematic dark UI, animated hero background, responsive layout, and custom SVG logo integration suitable for company websites, proposals, and digital branding.

## Overview

This project showcases a polished corporate marketing site for a fire safety and security solutions company. It combines:

- A responsive landing page structure
- A Three.js-powered animated hero background
- Premium dark-and-red visual styling
- Custom SVG brand logo integration
- Service, project, contact, and company information sections

The codebase is intentionally lightweight and framework-free, making it easy to host as a static site on platforms like GitHub Pages, Netlify, or Cloudflare Pages.

## Tech Stack

- **HTML5** for page structure
- **CSS3** for layout, animation, and responsive styling
- **Vanilla JavaScript** for UI behavior and interactions
- **Three.js** for hero-section visual effects
- **SVG** for scalable logo assets

## Features

- Responsive fixed navigation with mobile menu
- Animated hero section with WebGL background
- Branded SVG logo placement in navbar, hero, and footer
- Smooth entrance and scroll-based reveal animations
- Service and project showcase sections
- Contact section with business details and inquiry form UI
- Clean static architecture with no build step required for the website itself

## Project Structure

```text
.
├── index.html                  # Main site markup
├── style.css                   # Complete visual design and responsive styles
├── script.js                   # UI interactions and Three.js scene logic
├── logo.svg                    # Primary site logo used in the interface
├── rev-logo-full.svg           # Full-color logo asset
├── rev-logo-icon.svg           # Icon-only logo asset
├── rev-logo-monochrome.svg     # Monochrome logo asset
├── start.sh                    # Local startup helper
├── package.json                # CLI tooling scripts for deployment helpers
└── README.md                   # Project documentation
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/rudhrancodes-dev/revfiresecurity.git
cd revfiresecurity
```

### 2. Install optional tooling dependencies

The website itself is static and does not require a build step, but the repository includes CLI tooling for deployment workflows.

```bash
npm install
```

### 3. Run locally

You can open `index.html` directly in a browser, or use a local server for a cleaner development workflow.

Using the included script:

```bash
./start.sh
```

Or with a simple local server:

```bash
npx serve .
```

## Deployment

This project is suitable for static hosting providers.

### GitHub

The source is hosted here:

```text
https://github.com/rudhrancodes-dev/revfiresecurity
```

### Cloudflare Pages

The repository includes helper scripts in `package.json` for Cloudflare Pages deployment:

```bash
npm run cf:whoami
npm run cf:project:create
npm run cf:deploy
```

### Netlify

You can deploy the current directory as a static site with the Netlify CLI:

```bash
npx netlify-cli login
npx netlify-cli deploy --prod --dir .
```

## Design Notes

The visual direction aims for a high-end security-tech identity:

- Dark surfaces with controlled red highlights
- Clean typography and spacing
- Premium glass-like overlays in the hero
- Strong logo presence without overwhelming the content
- Motion used for atmosphere rather than distraction

## Customization

If you want to adapt this project for another company or client, the main areas to update are:

- Company name and copy in `index.html`
- Color variables in `style.css`
- Contact details and service descriptions
- SVG assets in the root folder
- Deployment scripts in `package.json`

## Notes for Developers

- The Three.js scene is isolated in `script.js`, so visual branding changes can usually be made without touching the rendering logic.
- Logo usage is centralized through shared CSS classes for navbar, hero, and footer presentation.
- The project is static-first and intentionally easy to maintain without a framework.

## License

This repository is currently provided without an explicit open-source license. Add a license file before public reuse or redistribution if needed.
