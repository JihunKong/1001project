import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = '/tmp/pdf-test/reader';
const BASE_URL = 'https://1001stories.seedsofempowerment.org';
const PDF_READER_URL = `${BASE_URL}/dashboard/learner/read/bbea2a66-e344-40a6-98e6-0e21f2e3a9f1/pdf`;

const SESSION_COOKIE = {
  name: 'next-auth.session-token',
  value: 'test-session-1769999541-3bbe734f5a8932567df1195b28cac335',
  domain: '1001stories.seedsofempowerment.org',
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'Lax' as const
};

async function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function testPDFReader() {
  console.log('Starting PDF Reader Test...\n');

  ensureDir(SCREENSHOT_DIR);

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    console.log('1. Launching browser...');

    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    console.log('2. Setting session cookie...');
    await context.addCookies([SESSION_COOKIE]);

    const page = await context.newPage();

    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[Browser Error]: ${msg.text()}`);
      }
    });

    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`[HTTP ${response.status()}]: ${response.url()}`);
      }
    });

    console.log(`3. Navigating to PDF reader: ${PDF_READER_URL}`);
    const response = await page.goto(PDF_READER_URL, {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    console.log(`   Response status: ${response?.status()}`);
    console.log(`   Final URL: ${page.url()}`);

    await page.waitForTimeout(3000);

    const screenshot1Path = path.join(SCREENSHOT_DIR, '01-initial-page-load.png');
    await page.screenshot({ path: screenshot1Path, fullPage: true });
    console.log(`   Screenshot saved: ${screenshot1Path}`);

    console.log('\n4. Analyzing page content...');

    const pageTitle = await page.title();
    console.log(`   Page title: ${pageTitle}`);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('   WARNING: Redirected to login page - session may not be valid');

      const screenshot2Path = path.join(SCREENSHOT_DIR, '02-login-redirect.png');
      await page.screenshot({ path: screenshot2Path, fullPage: true });
      console.log(`   Screenshot saved: ${screenshot2Path}`);

      return;
    }

    console.log('\n5. Checking for PDF viewer elements...');

    const pdfViewerSelectors = [
      'canvas',
      '[class*="pdf"]',
      '[class*="PDF"]',
      'iframe[src*="pdf"]',
      '.react-pdf__Page',
      '.react-pdf__Document',
      '[data-testid="pdf-viewer"]',
      '[class*="viewer"]'
    ];

    for (const selector of pdfViewerSelectors) {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        console.log(`   Found ${elements.length} element(s) matching: ${selector}`);
      }
    }

    const canvasElements = await page.$$('canvas');
    console.log(`\n   Total canvas elements: ${canvasElements.length}`);

    if (canvasElements.length > 0) {
      console.log('   PDF likely using canvas rendering');
    }

    console.log('\n6. Checking for navigation controls...');

    const navigationSelectors = [
      'button:has-text("Next")',
      'button:has-text("Previous")',
      'button:has-text("다음")',
      'button:has-text("이전")',
      '[aria-label*="next"]',
      '[aria-label*="previous"]',
      '[class*="navigation"]',
      '[class*="page-nav"]',
      'input[type="number"]'
    ];

    const navigationElements: string[] = [];

    for (const selector of navigationSelectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          navigationElements.push(selector);
          console.log(`   Found navigation: ${selector} (${elements.length} elements)`);
        }
      } catch (e) {
      }
    }

    const allButtons = await page.$$('button');
    console.log(`\n   Total buttons on page: ${allButtons.length}`);

    for (const button of allButtons.slice(0, 10)) {
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      if (text?.trim() || ariaLabel) {
        console.log(`   - Button: "${text?.trim() || ''}" ${ariaLabel ? `(aria-label: ${ariaLabel})` : ''}`);
      }
    }

    const screenshot3Path = path.join(SCREENSHOT_DIR, '03-pdf-interface.png');
    await page.screenshot({ path: screenshot3Path, fullPage: false });
    console.log(`\n   Screenshot saved: ${screenshot3Path}`);

    console.log('\n7. Attempting to find and click next page button...');

    const nextButtonSelectors = [
      'button:has-text(">")',
      'button:has-text("Next")',
      'button:has-text("다음")',
      '[aria-label*="next" i]',
      '[class*="next"]',
      'button svg[class*="right"]'
    ];

    let clicked = false;
    for (const selector of nextButtonSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          console.log(`   Clicked next button with selector: ${selector}`);
          clicked = true;
          await page.waitForTimeout(2000);
          break;
        }
      } catch (e) {
      }
    }

    if (!clicked) {
      console.log('   No next button found or clickable');
    }

    const screenshot4Path = path.join(SCREENSHOT_DIR, '04-after-navigation.png');
    await page.screenshot({ path: screenshot4Path, fullPage: false });
    console.log(`   Screenshot saved: ${screenshot4Path}`);

    console.log('\n8. Checking page content visibility...');

    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasContent = bodyText.length > 100;
    console.log(`   Page has content: ${hasContent} (${bodyText.length} characters)`);

    const errorMessages = await page.$$('[class*="error"], [class*="Error"], .text-red-500');
    if (errorMessages.length > 0) {
      console.log(`   Found ${errorMessages.length} potential error message(s)`);
      for (const el of errorMessages) {
        const text = await el.textContent();
        if (text?.trim()) {
          console.log(`   - Error: "${text.trim().substring(0, 100)}"`);
        }
      }
    }

    const loadingIndicators = await page.$$('[class*="loading"], [class*="Loading"], [class*="spinner"]');
    console.log(`   Loading indicators visible: ${loadingIndicators.length}`);

    console.log('\n========== PDF READER TEST SUMMARY ==========');
    console.log(`URL: ${currentUrl}`);
    console.log(`Canvas elements (PDF rendering): ${canvasElements.length}`);
    console.log(`Navigation controls found: ${navigationElements.length > 0 ? 'Yes' : 'No'}`);
    console.log(`Page has content: ${hasContent}`);
    console.log(`Error messages: ${errorMessages.length > 0 ? 'Yes' : 'No'}`);
    console.log('==============================================\n');

    console.log('Screenshots saved to:', SCREENSHOT_DIR);

  } catch (error) {
    console.error('Test failed with error:', error);
  } finally {
    await browser.close();
  }
}

testPDFReader().catch(console.error);
