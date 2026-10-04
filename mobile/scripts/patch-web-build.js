const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const webDir = path.join(__dirname, '..', 'web');
const assetsDir = path.join(__dirname, '..', 'assets');
const publicDir = path.join(__dirname, '..', 'public');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Copy web files (manifest.json, sw.js) to dist and public
const filesToCopy = ['manifest.json', 'sw.js'];
filesToCopy.forEach((file) => {
  const src = path.join(webDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(distDir, file));
    fs.copyFileSync(src, path.join(publicDir, file));
  }
});

// 2. Copy asset images (icon.png, favicon.png, etc.)
const assetFiles = ['icon.png', 'favicon.png', 'logo.png', 'adaptive-icon.png'];
assetFiles.forEach((file) => {
  const src = path.join(assetsDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(distDir, file));
    fs.copyFileSync(src, path.join(publicDir, file));
    if (file === 'icon.png') {
      fs.copyFileSync(src, path.join(distDir, 'apple-touch-icon.png'));
      fs.copyFileSync(src, path.join(publicDir, 'apple-touch-icon.png'));
    }
  }
});

// 3. Patch index.html in dist
const indexHtmlPath = path.join(distDir, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  let html = fs.readFileSync(indexHtmlPath, 'utf8');

  // Ensure title is BarberPlan
  html = html.replace(/<title>.*?<\/title>/gi, '<title>BarberPlan - Go\'zallik va sartaroshlik ustalari uchun CRM</title>');

  // Ensure viewport has viewport-fit=cover
  if (!html.includes('viewport-fit=cover')) {
    html = html.replace(
      /name=["']viewport["']\s+content=["'](.*?)["']/i,
      'name="viewport" content="$1, viewport-fit=cover"'
    );
  }

  // Inject PWA meta tags if not present
  const metaTags = `
    <!-- BarberPlan PWA Meta Tags -->
    <link rel="manifest" href="/manifest.json" />
    <meta name="theme-color" content="#2563EB" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="BarberPlan" />
    <link rel="apple-touch-icon" href="/icon.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/icon.png" />
    <link rel="icon" type="image/png" href="/icon.png" />
  `;

  if (!html.includes('rel="manifest"')) {
    html = html.replace('</head>', `${metaTags}\n  </head>`);
  }

  // Inject Service Worker registration if not present
  const swScript = `
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
          navigator.serviceWorker.register('/sw.js').catch(function(err) {
            console.log('SW registration error:', err);
          });
        });
      }
    </script>
  `;

  if (!html.includes('/sw.js')) {
    html = html.replace('</body>', `${swScript}\n  </body>`);
  }

  fs.writeFileSync(indexHtmlPath, html, 'utf8');
  console.log('✅ Successfully patched mobile/dist/index.html with PWA manifests, meta tags, and ServiceWorker registration.');
}
