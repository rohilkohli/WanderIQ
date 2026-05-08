const fs = require('fs');

const files = [
  'src/pages/Onboarding.tsx',
  'src/pages/Profile.tsx',
  'src/pages/Discover.tsx',
  'src/pages/Budget.tsx',
  'src/pages/Packing.tsx',
  'src/components/auth/SignInModal.tsx',
  'src/pages/Dashboard.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  const match = content.match(/const (\w+): React\.FC.*? = \(\{.*?\}\s*\|\s*\)\s*=>\s*\{([\s\S]*?)return \(/);
  if (!match && content.includes(': React.FC = () => {')) {
    const match2 = content.match(/const (\w+): React\.FC = \(\) => \{([\s\S]*?)return \(/);
    if (match2) {
      const name = match2[1];
      const logic = match2[2];
      
      const hookName = `use${name}Logic`;
      const hookContent = `import { useState, useEffect, useCallback, useMemo } from 'react';\n` + 
      `import { useNavigate, useSearchParams } from 'react-router-dom';\n` +
      `import { useAuthStore } from '@/store/useAuthStore';\n` +
      `import { usePreferencesStore } from '@/store/usePreferencesStore';\n` +
      `import { analytics } from '@/lib/analytics';\n` +
      `import toast from 'react-hot-toast';\n\n` +
      `export const ${hookName} = () => {\n${logic}\n  return { /* TODO: export variables */ };\n};\n`;
      
      // I can't auto-determine what to return easily.
    }
  }
});
