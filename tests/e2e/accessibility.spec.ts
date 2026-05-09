import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

const routes = ['/', '/onboarding', '/dashboard', '/discover', '/planner'];

test.describe('Accessibility Audit', () => {
  for (const route of routes) {
    test(`Route ${route} should have no critical or serious violations`, async ({ page }) => {
      await page.goto('http://localhost:5174' + route);
      await page.waitForSelector('.loading-screen-container', { state: 'hidden', timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(500); // give app a moment to render
      await injectAxe(page);
      
      await checkA11y(page, undefined, {
        includedImpacts: ['critical', 'serious'],
        detailedReport: false,
        detailedReportOptions: { html: false }
      });
    });
  }
});
