const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');
const publicDir = path.join(__dirname, '..', 'public');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 1. Ensure icons are generated and copied from public to dist
if (fs.existsSync(publicDir)) {
  const publicFiles = fs.readdirSync(publicDir);
  publicFiles.forEach((file) => {
    const src = path.join(publicDir, file);
    const dest = path.join(distDir, file);
    fs.copyFileSync(src, dest);
  });
}

// 2. Patch index.html in dist
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
    <link rel="apple-touch-icon" href="/icon-180.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/icon-180.png" />
    <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
    <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
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

// 3. Post-build Validation: Verify all icons in manifest.json exist in dist and are valid PNGs
const manifestPath = path.join(distDir, 'manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log('🔍 Validating Barbero PWA icons in dist:');
  const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  if (Array.isArray(manifest.icons)) {
    for (const icon of manifest.icons) {
      const iconFileName = icon.src.replace(/^\//, '');
      const iconPath = path.join(distDir, iconFileName);
      if (!fs.existsSync(iconPath)) {
        throw new Error(`❌ Missing manifest icon file: ${iconPath}`);
      }
      const iconBuf = fs.readFileSync(iconPath);
      if (!iconBuf.subarray(0, 8).equals(pngHeader)) {
        throw new Error(`❌ Icon file ${iconFileName} is not a valid PNG!`);
      }
      console.log(` ✓ Manifest icon ${icon.src} (${icon.sizes}) verified as valid PNG (${iconBuf.length} bytes)`);
    }
  }
}
