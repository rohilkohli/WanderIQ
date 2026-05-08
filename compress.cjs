const fs = require('fs');
const path = require('path');
function getFiles(dir){return fs.readdirSync(dir).reduce((list,file)=>{const f=path.join(dir,file);return fs.statSync(f).isDirectory()?list.concat(getFiles(f)):list.concat(f)},[])}
const files = [...getFiles('src/pages'), ...getFiles('src/components')].filter(f=>f.endsWith('.tsx'));
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/style=\{\{([\s\S]*?)\}\}/g, (match, p1) => {
    return 'style={{ ' + p1.replace(/\s+/g, ' ').trim() + ' }}';
  });
  content = content.replace(/className=\"([\s\S]*?)\"/g, (match, p1) => {
    return 'className=\"' + p1.replace(/\s+/g, ' ').trim() + '\"';
  });
  fs.writeFileSync(f, content);
});
