const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');

const pageLoadBlueprint = async function () {
    // Configuration for 1001 Stories website monitoring
    const config = {
        includeRequestHeaders: true,
        includeResponseHeaders: true,
        restrictedHeaders: [],
        restrictedUrlParameters: []
    };

    let page = await synthetics.getPage();

    // Main page load test
    const response = await synthetics.executeStep('loadPage', async () => {
        const response = await page.goto('https://${domain_name}/', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        if (!response.ok()) {
            throw new Error(`Page load failed with status: ${response.status()}`);
        }

        return response;
    });

    // Check page title
    await synthetics.executeStep('checkPageTitle', async () => {
        const title = await page.title();
        log.info('Page title: ' + title);

        if (!title || title === '') {
            throw new Error('Page title is empty');
        }
    });

    // Test login page accessibility
    await synthetics.executeStep('checkLoginPage', async () => {
        await page.goto('https://${domain_name}/login', {
            waitUntil: 'networkidle0',
            timeout: 15000
        });

        // Check if login form is present
        const emailInput = await page.$('input[type="email"], input[name="email"]');
        if (!emailInput) {
            throw new Error('Login form not found or not accessible');
        }

        log.info('Login page is accessible');
    });

    // Test API health endpoint
    await synthetics.executeStep('checkHealthAPI', async () => {
        const healthResponse = await page.goto('https://${domain_name}/api/health', {
            timeout: 10000
        });

        if (!healthResponse.ok()) {
            throw new Error(`Health API failed with status: ${healthResponse.status()}`);
        }

        const healthData = await healthResponse.text();
        log.info('Health API response: ' + healthData);
    });

    // Test demo functionality
    await synthetics.executeStep('checkDemoAccess', async () => {
        await page.goto('https://${domain_name}/demo', {
            waitUntil: 'networkidle0',
            timeout: 15000
        });

        // Look for demo content indicators
        const demoIndicator = await page.$('.demo-banner, [data-testid="demo-mode"], .yellow-banner');
        if (!demoIndicator) {
            log.warn('Demo mode indicator not found - this may be expected');
        } else {
            log.info('Demo mode is accessible');
        }
    });

    // Performance checks
    await synthetics.executeStep('checkPerformance', async () => {
        // Navigate back to main page for performance measurement
        const startTime = Date.now();

        await page.goto('https://${domain_name}/', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        const loadTime = Date.now() - startTime;
        log.info(`Page load time: ${loadTime}ms`);

        if (loadTime > 5000) {
            log.warn(`Page load time is high: ${loadTime}ms`);
        }

        // Check for JavaScript errors
        const jsErrors = await page.evaluate(() => {
            return window.jsErrors || [];
        });

        if (jsErrors.length > 0) {
            log.warn('JavaScript errors detected: ' + JSON.stringify(jsErrors));
        }
    });

    // Test static assets loading
    await synthetics.executeStep('checkStaticAssets', async () => {
        const response = await page.goto('https://${domain_name}/', {
            waitUntil: 'networkidle0'
        });

        // Check for common static assets
        const failedRequests = [];

        page.on('response', response => {
            if (!response.ok() && response.url().includes('.css') ||
                response.url().includes('.js') ||
                response.url().includes('.png') ||
                response.url().includes('.jpg') ||
                response.url().includes('.ico')) {
                failedRequests.push({
                    url: response.url(),
                    status: response.status()
                });
            }
        });

        // Wait a bit for all assets to load
        await page.waitForTimeout(2000);

        if (failedRequests.length > 0) {
            log.warn('Failed static asset requests: ' + JSON.stringify(failedRequests));
        }
    });

    // Educational platform specific checks
    await synthetics.executeStep('checkEducationalFeatures', async () => {
        // Check if role selection is available on home page
        const roleCards = await page.$$('.role-card, [data-testid="role-card"], .user-role');

        if (roleCards.length === 0) {
            log.warn('No role selection cards found - may indicate issue with main navigation');
        } else {
            log.info(`Found ${roleCards.length} role cards`);
        }

        // Test navigation to different sections
        const navLinks = await page.$$('nav a, .navigation a');
        if (navLinks.length === 0) {
            log.warn('No navigation links found');
        } else {
            log.info(`Found ${navLinks.length} navigation links`);
        }
    });

    // Mobile responsiveness check
    await synthetics.executeStep('checkMobileView', async () => {
        // Set mobile viewport
        await page.setViewport({ width: 375, height: 667 });

        await page.goto('https://${domain_name}/', {
            waitUntil: 'networkidle0',
            timeout: 15000
        });

        // Check if mobile menu is present or if content is responsive
        const mobileMenu = await page.$('.mobile-menu, [data-testid="mobile-menu"], .hamburger');
        const responsiveContent = await page.$('.responsive, .mobile-responsive, .flex, .grid');

        if (!mobileMenu && !responsiveContent) {
            log.warn('Mobile responsiveness indicators not found');
        } else {
            log.info('Mobile view appears to be properly supported');
        }

        // Reset to desktop viewport
        await page.setViewport({ width: 1280, height: 720 });
    });

    // Security headers check
    await synthetics.executeStep('checkSecurityHeaders', async () => {
        const response = await page.goto('https://${domain_name}/', {
            timeout: 15000
        });

        const headers = response.headers();
        const securityHeaders = [
            'x-content-type-options',
            'x-frame-options',
            'x-xss-protection',
            'strict-transport-security'
        ];

        const missingHeaders = [];
        securityHeaders.forEach(header => {
            if (!headers[header]) {
                missingHeaders.push(header);
            }
        });

        if (missingHeaders.length > 0) {
            log.warn('Missing security headers: ' + missingHeaders.join(', '));
        } else {
            log.info('Security headers are properly configured');
        }
    });

    log.info('Website monitoring completed successfully');
};

exports.handler = async () => {
    return await synthetics.executeStep('websiteMonitoring', pageLoadBlueprint);
};