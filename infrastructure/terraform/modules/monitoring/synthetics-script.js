// CloudWatch Synthetics script for 1001 Stories health monitoring
const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');

const pageLoadBlueprint = async function () {
    // Configure synthetics
    const syntheticConfiguration = synthetics.getConfiguration();
    syntheticConfiguration.setConfig({
        includeRequestHeaders: true,
        includeResponseHeaders: true,
        restrictedHeaders: ['x-api-key'],
        restrictedUrlParameters: ['password', 'token']
    });

    // Health check URL from template
    const healthCheckUrl = '${health_check_url}';
    const appUrl = healthCheckUrl.replace('/api/health', '');

    let page = await synthetics.getPage();

    // Step 1: Test API Health Endpoint
    log.info('Testing API health endpoint');
    const healthResponse = await page.goto(healthCheckUrl, {
        waitUntil: 'networkidle0',
        timeout: 30000
    });

    if (healthResponse.status() !== 200) {
        throw new Error(`Health check failed with status: ${healthResponse.status()}`);
    }

    const healthBody = await healthResponse.text();
    const healthData = JSON.parse(healthBody);

    if (healthData.status !== 'ok') {
        throw new Error(`Health check status is not ok: ${healthData.status}`);
    }

    log.info('API health check passed');

    // Step 2: Test Main Application Landing Page
    log.info('Testing main application page');
    const appResponse = await page.goto(appUrl, {
        waitUntil: 'networkidle0',
        timeout: 30000
    });

    if (appResponse.status() !== 200) {
        throw new Error(`Main page failed with status: ${appResponse.status()}`);
    }

    // Wait for critical elements to load
    await page.waitForSelector('body', { timeout: 10000 });

    // Check for critical elements that should be present
    const title = await page.title();
    if (!title || title.length === 0) {
        throw new Error('Page title is missing');
    }

    log.info(`Main page loaded successfully with title: ${title}`);

    // Step 3: Test Library/Books Page (public access)
    log.info('Testing library page');
    const libraryUrl = `${appUrl}/library`;
    const libraryResponse = await page.goto(libraryUrl, {
        waitUntil: 'networkidle0',
        timeout: 30000
    });

    if (libraryResponse.status() !== 200) {
        log.warn(`Library page returned status: ${libraryResponse.status()}`);
    } else {
        log.info('Library page loaded successfully');
    }

    // Step 4: Test Login Page
    log.info('Testing login page');
    const loginUrl = `${appUrl}/login`;
    const loginResponse = await page.goto(loginUrl, {
        waitUntil: 'networkidle0',
        timeout: 30000
    });

    if (loginResponse.status() !== 200) {
        log.warn(`Login page returned status: ${loginResponse.status()}`);
    } else {
        // Check for login form elements
        const emailInput = await page.$('input[type="email"], input[name="email"]');
        if (!emailInput) {
            log.warn('Email input field not found on login page');
        } else {
            log.info('Login page loaded successfully with email input');
        }
    }

    // Step 5: Performance Metrics Collection
    const performanceMetrics = await page.evaluate(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        return {
            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
            loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
            firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 0,
            firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
        };
    });

    log.info(`Performance metrics: ${JSON.stringify(performanceMetrics)}`);

    // Custom CloudWatch metrics
    await synthetics.addUserAgentMetric('DOMContentLoaded', performanceMetrics.domContentLoaded, 'Milliseconds');
    await synthetics.addUserAgentMetric('LoadComplete', performanceMetrics.loadComplete, 'Milliseconds');
    await synthetics.addUserAgentMetric('FirstPaint', performanceMetrics.firstPaint, 'Milliseconds');
    await synthetics.addUserAgentMetric('FirstContentfulPaint', performanceMetrics.firstContentfulPaint, 'Milliseconds');

    // Step 6: Check for console errors
    const logs = await page.evaluate(() => {
        const errors = [];
        const originalError = console.error;
        console.error = function(...args) {
            errors.push(args.join(' '));
            originalError.apply(console, args);
        };
        return errors;
    });

    if (logs.length > 0) {
        log.warn(`Console errors detected: ${JSON.stringify(logs)}`);
    }

    log.info('All health checks completed successfully');
};

exports.handler = async () => {
    return await synthetics.executeStep('pageLoadBlueprint', pageLoadBlueprint);
};