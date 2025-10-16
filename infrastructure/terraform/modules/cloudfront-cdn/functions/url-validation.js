// CloudFront Function for URL validation and role-based access control
// 1001 Stories Educational Platform

function handler(event) {
    var request = event.request;
    var uri = request.uri;
    var headers = request.headers;
    var querystring = request.querystring;

    // Allowed roles from Terraform variable
    var allowedRoles = ${jsonencode(allowed_roles)};

    // Public paths that don't require authentication
    var publicPaths = [
        '/static/',
        '/favicon.ico',
        '/robots.txt',
        '/sitemap.xml',
        '/404.html',
        '/500.html'
    ];

    // Check if this is a public path
    var isPublicPath = false;
    for (var i = 0; i < publicPaths.length; i++) {
        if (uri.indexOf(publicPaths[i]) === 0) {
            isPublicPath = true;
            break;
        }
    }

    // Allow public paths without authentication
    if (isPublicPath) {
        return request;
    }

    // Extract user role from headers or query parameters
    var userRole = null;

    // Check for role in headers
    if (headers['x-user-role']) {
        userRole = headers['x-user-role'].value;
    }

    // Check for role in query parameters
    if (!userRole && querystring.role) {
        userRole = querystring.role.value;
    }

    // Check for role in custom authorization header
    if (!userRole && headers.authorization) {
        var authHeader = headers.authorization.value;
        var roleMatch = authHeader.match(/Role=([^;,\s]+)/);
        if (roleMatch) {
            userRole = roleMatch[1];
        }
    }

    // Validate user role
    if (!userRole || allowedRoles.indexOf(userRole) === -1) {
        return {
            statusCode: 403,
            statusDescription: 'Forbidden',
            headers: {
                'content-type': { value: 'application/json' },
                'cache-control': { value: 'no-cache, no-store, must-revalidate' }
            },
            body: JSON.stringify({
                error: 'Access denied',
                message: 'Valid user role required for educational content access'
            })
        };
    }

    // Role-based path access control
    var rolePermissions = {
        'learner': [
            '/books/published/',
            '/thumbnails/books/'
        ],
        'teacher': [
            '/books/published/',
            '/books/covers/',
            '/thumbnails/',
            '/templates/',
            '/submissions/pending/'
        ],
        'volunteer': [
            '/books/published/',
            '/templates/',
            '/submissions/pending/'
        ],
        'story_manager': [
            '/books/',
            '/submissions/',
            '/templates/'
        ],
        'book_manager': [
            '/books/',
            '/submissions/approved/',
            '/ai-generated/',
            '/templates/'
        ],
        'content_admin': [
            '/books/',
            '/submissions/',
            '/ai-generated/',
            '/templates/',
            '/thumbnails/'
        ],
        'admin': [
            '/' // Full access
        ]
    };

    // Check if user has permission for this path
    var userPermissions = rolePermissions[userRole] || [];
    var hasPermission = false;

    // Admin has access to everything
    if (userRole === 'admin') {
        hasPermission = true;
    } else {
        // Check each permission path
        for (var j = 0; j < userPermissions.length; j++) {
            if (uri.indexOf(userPermissions[j]) === 0) {
                hasPermission = true;
                break;
            }
        }
    }

    if (!hasPermission) {
        return {
            statusCode: 403,
            statusDescription: 'Forbidden',
            headers: {
                'content-type': { value: 'application/json' },
                'cache-control': { value: 'no-cache, no-store, must-revalidate' }
            },
            body: JSON.stringify({
                error: 'Insufficient permissions',
                message: 'Your role (' + userRole + ') does not have access to this content',
                requiredRole: 'Contact your administrator for access'
            })
        };
    }

    // Special handling for learner access to published books
    if (userRole === 'learner' && uri.indexOf('/books/published/') === 0) {
        // Check for assignment tag in query parameters
        var hasAssignment = false;

        // Check for assignment query parameter
        if (querystring.assigned && querystring.assigned.value === 'true') {
            hasAssignment = true;
        }

        // Check for teacher assignment header
        if (headers['x-teacher-assignment']) {
            hasAssignment = true;
        }

        // Learners can only access assigned books
        if (!hasAssignment) {
            return {
                statusCode: 403,
                statusDescription: 'Forbidden',
                headers: {
                    'content-type': { value: 'application/json' },
                    'cache-control': { value: 'no-cache, no-store, must-revalidate' }
                },
                body: JSON.stringify({
                    error: 'Book not assigned',
                    message: 'This book has not been assigned to you by your teacher',
                    contact: 'Please contact your teacher for book assignments'
                })
            };
        }
    }

    // Add security headers for all requests
    if (!request.headers['x-user-role']) {
        request.headers['x-user-role'] = { value: userRole };
    }

    // Add educational platform identifier
    request.headers['x-educational-platform'] = { value: '1001-stories' };

    // Add timestamp for audit logging
    request.headers['x-access-timestamp'] = { value: new Date().toISOString() };

    // Log access for monitoring (in real implementation, this would go to CloudWatch)
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        userRole: userRole,
        uri: uri,
        sourceIP: event.viewer.ip,
        userAgent: headers['user-agent'] ? headers['user-agent'].value : 'unknown',
        action: 'content_access_granted'
    }));

    // Handle PDF access optimization
    if (uri.indexOf('.pdf') !== -1) {
        // Add PDF-specific headers
        request.headers['x-content-type'] = { value: 'application/pdf' };

        // For mobile devices, suggest PDF viewer
        var userAgent = headers['user-agent'] ? headers['user-agent'].value.toLowerCase() : '';
        if (userAgent.indexOf('mobile') !== -1 || userAgent.indexOf('android') !== -1) {
            request.headers['x-mobile-pdf'] = { value: 'true' };
        }
    }

    // Handle audio file access
    if (uri.indexOf('/audio/') === 0) {
        // Add audio-specific headers
        request.headers['x-content-type'] = { value: 'audio/mpeg' };
        request.headers['x-streaming-support'] = { value: 'true' };
    }

    // Handle image optimization for thumbnails
    if (uri.indexOf('/thumbnails/') === 0) {
        // Add image optimization headers
        var acceptHeader = headers.accept ? headers.accept.value : '';

        // Prefer WebP for supported browsers
        if (acceptHeader.indexOf('image/webp') !== -1) {
            request.headers['x-image-format'] = { value: 'webp' };
        }

        // Check for high-DPI displays
        if (headers['x-device-pixel-ratio'] && parseFloat(headers['x-device-pixel-ratio'].value) > 1) {
            request.headers['x-high-dpi'] = { value: 'true' };
        }
    }

    // URL rewriting for SEO-friendly paths
    if (uri === '/books' || uri === '/books/') {
        request.uri = '/books/index.html';
    }

    if (uri === '/library' || uri === '/library/') {
        request.uri = '/books/published/index.html';
    }

    // Add cache control based on content type and user role
    var cacheHeaders = {};

    if (userRole === 'learner') {
        // Longer cache for learners (content doesn't change often)
        cacheHeaders['cache-control'] = { value: 'public, max-age=3600' };
    } else if (userRole === 'admin' || userRole === 'content_admin') {
        // No cache for admins (need fresh content)
        cacheHeaders['cache-control'] = { value: 'no-cache, no-store, must-revalidate' };
    } else {
        // Medium cache for other roles
        cacheHeaders['cache-control'] = { value: 'public, max-age=1800' };
    }

    // Merge cache headers into request
    Object.keys(cacheHeaders).forEach(function(key) {
        request.headers[key] = cacheHeaders[key];
    });

    return request;
}