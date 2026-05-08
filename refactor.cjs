const fs = require('fs');

function refactorLanding() {
  let content = fs.readFileSync('src/pages/Landing.tsx', 'utf8');

  const extractComponent = (name, regex, propsStr) => {
    const match = content.match(regex);
    if (match) {
      let compContent = `import React from 'react';\nimport { useNavigate } from 'react-router-dom';\nimport { DESTINATIONS, FEATURES, STATS } from './LandingConstants';\n\n`;
      if (propsStr) {
        compContent += `export interface ${name}Props { ${propsStr} }\n`;
        compContent += `export const ${name}: React.FC<${name}Props> = ({ ${propsStr.split(':')[0].trim()} }) => {\n`;
      } else {
        compContent += `export const ${name}: React.FC = () => {\n`;
      }
      compContent += `  const navigate = useNavigate();\n  return (\n    ${match[0]}\n  );\n};\n`;
      
      fs.writeFileSync(`src/pages/${name}.tsx`, compContent);
      
      const propsPass = propsStr ? `${propsStr.split(':')[0].trim()}={${propsStr.split(':')[0].trim()}}` : '';
      content = content.replace(match[0], `<${name} ${propsPass} />`);
      content = `import { ${name} } from './${name}';\n` + content;
      console.log('Extracted', name);
    }
  };

  extractComponent('LandingHeader', /<header[\s\S]*?<\/header>/, 'user: any, setShowSignIn: any');
  extractComponent('LandingHero', /<section[\s\S]*?aria-labelledby="hero-heading"[\s\S]*?<\/section>/, 'moodQuery: any, setMoodQuery: any, handleMoodSearch: any, handleCTA: any');
  extractComponent('LandingStats', /<section[\s\S]*?aria-label="WanderIQ by the numbers"[\s\S]*?<\/section>/);
  extractComponent('LandingFeatures', /<section[\s\S]*?id="features"[\s\S]*?<\/section>/);
  extractComponent('LandingHowItWorks', /<section[\s\S]*?id="how-it-works"[\s\S]*?<\/section>/);
  extractComponent('LandingPricing', /<section[\s\S]*?id="pricing"[\s\S]*?<\/section>/);
  extractComponent('LandingFooter', /<footer[\s\S]*?<\/footer>/);

  fs.writeFileSync('src/pages/Landing.tsx', content);
}

refactorLanding();
