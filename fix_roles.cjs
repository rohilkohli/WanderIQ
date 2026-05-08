const fs = require('fs');

function fix(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/role="list"/g, '');
  content = content.replace(/role="listitem"/g, '');
  content = content.replace(/role='list'/g, '');
  content = content.replace(/role='listitem'/g, '');
  fs.writeFileSync(file, content);
}

fix('src/pages/Dashboard.tsx');
fix('src/pages/Onboarding.tsx');
