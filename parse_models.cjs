const data = require('fs').readFileSync(0, 'utf8');
const models = JSON.parse(data).models;
models.filter(m => m.name.includes('flash') || m.name.includes('pro')).forEach(m => {
  const methods = m.supportedGenerationMethods || [];
  if (methods.includes('generateContent')) {
    console.log(m.name);
  }
});
