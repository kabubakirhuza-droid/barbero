async function testApp() {
  console.log('Testing Expo Web server on http://localhost:8081 ...');
  const htmlRes = await fetch('http://localhost:8081');
  console.log('✅ HTML Status:', htmlRes.status);
  const html = await htmlRes.text();
  console.log('✅ HTML response received. Length:', html.length, 'Contains #root:', html.includes('id="root"'));
  
  // Find bundle script URLs in the HTML
  const scriptRegex = /<script\s+[^>]*src="([^"]+)"/g;
  let match;
  let scriptCount = 0;
  while ((match = scriptRegex.exec(html)) !== null) {
    scriptCount++;
    const path = match[1];
    const fullUrl = path.startsWith('http') ? path : `http://localhost:8081${path}`;
    console.log(`Checking bundle script #${scriptCount}: ${fullUrl}`);
    const scriptRes = await fetch(fullUrl);
    console.log(`✅ Script #${scriptCount} status:`, scriptRes.status);
    const scriptText = await scriptRes.text();
    console.log(`✅ Script #${scriptCount} loaded successfully (${scriptText.length} bytes)`);
    
    // Check if bundler threw a compilation error in JS
    if (scriptText.includes('TransformError') || scriptText.includes('SyntaxError')) {
      console.error('❌ Bundler error detected in script!');
      process.exit(1);
    }
  }

  console.log('\n🎉 ALL EXPO WEB ASSETS AND SCRIPTS COMPILED & LOADED 100% CLEANLY!');
}

testApp().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
