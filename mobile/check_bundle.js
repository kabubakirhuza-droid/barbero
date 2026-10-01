async function check() {
  const res = await fetch('http://localhost:8081/node_modules/expo/AppEntry.bundle?platform=web&dev=true&hot=false');
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('First 200 chars:\n', text.slice(0, 200));
  
  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const json = JSON.parse(text);
      console.log('Returned JSON error:', json);
      return;
    } catch(e) {}
  }
  
  console.log('Returned actual JS bundle! Total size:', text.length, 'bytes');
  console.log('Bundle contains React:', text.includes('React'));
  console.log('Bundle contains Planr components:', text.includes('JadvalScreen'));
}

check().catch(console.error);
