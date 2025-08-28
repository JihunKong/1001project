-- Test Database Initialization Script
-- Sets up test data and configurations for role system testing

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create test-specific functions for data generation
CREATE OR REPLACE FUNCTION generate_test_user(
    p_email TEXT,
    p_role TEXT DEFAULT 'CUSTOMER',
    p_name TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    user_id UUID;
BEGIN
    INSERT INTO "User" (
        id,
        email,
        name,
        role,
        "createdAt",
        "updatedAt"
    ) VALUES (
        uuid_generate_v4(),
        p_email,
        COALESCE(p_name, 'Test User'),
        p_role::"UserRole",
        NOW(),
        NOW()
    ) RETURNING id INTO user_id;
    
    RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create test orders
CREATE OR REPLACE FUNCTION create_test_order(
    p_user_id UUID,
    p_product_id TEXT DEFAULT 'test-product',
    p_amount DECIMAL DEFAULT 9.99,
    p_status TEXT DEFAULT 'completed'
) RETURNS UUID AS $$
DECLARE
    order_id UUID;
BEGIN
    INSERT INTO "Order" (
        id,
        "userId",
        "productId",
        amount,
        status,
        "createdAt",
        "updatedAt"
    ) VALUES (
        uuid_generate_v4(),
        p_user_id,
        p_product_id,
        p_amount,
        p_status,
        NOW(),
        NOW()
    ) RETURNING id INTO order_id;
    
    RETURN order_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create test donations
CREATE OR REPLACE FUNCTION create_test_donation(
    p_user_id UUID,
    p_amount DECIMAL DEFAULT 25.00,
    p_program TEXT DEFAULT 'seeds-of-empowerment'
) RETURNS UUID AS $$
DECLARE
    donation_id UUID;
BEGIN
    INSERT INTO "Donation" (
        id,
        "userId",
        amount,
        program,
        "createdAt",
        "updatedAt"
    ) VALUES (
        uuid_generate_v4(),
        p_user_id,
        p_amount,
        p_program,
        NOW(),
        NOW()
    ) RETURNING id INTO donation_id;
    
    RETURN donation_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create test stories
CREATE OR REPLACE FUNCTION create_test_story(
    p_title TEXT DEFAULT 'Test Story',
    p_author TEXT DEFAULT 'Test Author',
    p_published BOOLEAN DEFAULT true
) RETURNS UUID AS $$
DECLARE
    story_id UUID;
BEGIN
    INSERT INTO "Story" (
        id,
        title,
        author,
        published,
        "createdAt",
        "updatedAt"
    ) VALUES (
        uuid_generate_v4(),
        p_title,
        p_author,
        p_published,
        NOW(),
        NOW()
    ) RETURNING id INTO story_id;
    
    RETURN story_id;
END;
$$ LANGUAGE plpgsql;

-- Create base test users for different scenarios
DO $$
DECLARE
    admin_user_id UUID;
    customer_user_id UUID;
    learner_user_id UUID;
    test_story_id UUID;
BEGIN
    -- Create admin user
    admin_user_id := generate_test_user(
        'admin@test.1001stories.org',
        'ADMIN',
        'Test Admin User'
    );
    
    -- Create customer user
    customer_user_id := generate_test_user(
        'customer@test.1001stories.org',
        'CUSTOMER',
        'Test Customer User'
    );
    
    -- Create learner user (for migration testing)
    learner_user_id := generate_test_user(
        'learner@test.1001stories.org',
        'LEARNER',
        'Test Learner User'
    );
    
    -- Create demo user
    INSERT INTO "User" (
        id,
        email,
        name,
        role,
        "createdAt",
        "updatedAt"
    ) VALUES (
        uuid_generate_v4(),
        'demo@1001stories.org',
        'Demo User',
        'CUSTOMER',
        NOW(),
        NOW()
    );
    
    -- Create test orders for customer
    PERFORM create_test_order(customer_user_id, 'book-1', 12.99, 'completed');
    PERFORM create_test_order(customer_user_id, 'book-2', 8.99, 'completed');
    PERFORM create_test_order(customer_user_id, 'book-3', 15.99, 'pending');
    
    -- Create test orders for learner (to test migration)
    PERFORM create_test_order(learner_user_id, 'book-4', 11.99, 'completed');
    PERFORM create_test_order(learner_user_id, 'book-5', 9.99, 'completed');
    
    -- Create test donations
    PERFORM create_test_donation(customer_user_id, 50.00, 'seeds-of-empowerment');
    PERFORM create_test_donation(learner_user_id, 25.00, 'seeds-of-empowerment');
    
    -- Create test stories
    test_story_id := create_test_story('The Adventure Begins', 'Maria Santos', true);
    PERFORM create_test_story('Journey to School', 'Ahmed Hassan', true);
    PERFORM create_test_story('My Dream', 'Lin Wei', true);
    PERFORM create_test_story('Hope in the Village', 'Priya Patel', true);
    PERFORM create_test_story('Draft Story', 'Test Author', false);
    
    -- Log successful initialization
    RAISE NOTICE 'Test database initialized successfully with:';
    RAISE NOTICE '- Admin user: admin@test.1001stories.org';
    RAISE NOTICE '- Customer user: customer@test.1001stories.org'; 
    RAISE NOTICE '- Learner user: learner@test.1001stories.org';
    RAISE NOTICE '- Demo user: demo@1001stories.org';
    RAISE NOTICE '- 5 test orders created';
    RAISE NOTICE '- 2 test donations created';
    RAISE NOTICE '- 5 test stories created';
END $$;

-- Create indexes for test performance
CREATE INDEX IF NOT EXISTS idx_user_role_test ON "User"(role);
CREATE INDEX IF NOT EXISTS idx_user_email_test ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_order_user_test ON "Order"("userId");
CREATE INDEX IF NOT EXISTS idx_donation_user_test ON "Donation"("userId");

-- Function to clean up test data
CREATE OR REPLACE FUNCTION cleanup_test_data(p_timestamp TEXT DEFAULT NULL) RETURNS JSON AS $$
DECLARE
    deleted_users INTEGER := 0;
    deleted_orders INTEGER := 0;
    deleted_donations INTEGER := 0;
    deleted_stories INTEGER := 0;
    cleanup_filter TEXT;
BEGIN
    IF p_timestamp IS NOT NULL THEN
        cleanup_filter := '%' || p_timestamp || '%';
    ELSE
        cleanup_filter := '%test.1001stories.org%';
    END IF;
    
    -- Delete orders first (foreign key dependency)
    DELETE FROM "Order" o 
    USING "User" u 
    WHERE o."userId" = u.id 
    AND (u.email LIKE cleanup_filter OR u.email LIKE '%test%');
    
    GET DIAGNOSTICS deleted_orders = ROW_COUNT;
    
    -- Delete donations
    DELETE FROM "Donation" d 
    USING "User" u 
    WHERE d."userId" = u.id 
    AND (u.email LIKE cleanup_filter OR u.email LIKE '%test%');
    
    GET DIAGNOSTICS deleted_donations = ROW_COUNT;
    
    -- Delete test stories
    DELETE FROM "Story" 
    WHERE title LIKE '%Test%' OR author LIKE '%Test%';
    
    GET DIAGNOSTICS deleted_stories = ROW_COUNT;
    
    -- Delete users
    DELETE FROM "User" 
    WHERE email LIKE cleanup_filter OR email LIKE '%test%';
    
    GET DIAGNOSTICS deleted_users = ROW_COUNT;
    
    RETURN json_build_object(
        'deletedUsers', deleted_users,
        'deletedOrders', deleted_orders,
        'deletedDonations', deleted_donations,
        'deletedStories', deleted_stories,
        'timestamp', NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for test functions
GRANT EXECUTE ON FUNCTION generate_test_user(TEXT, TEXT, TEXT) TO PUBLIC;
GRANT EXECUTE ON FUNCTION create_test_order(UUID, TEXT, DECIMAL, TEXT) TO PUBLIC;
GRANT EXECUTE ON FUNCTION create_test_donation(UUID, DECIMAL, TEXT) TO PUBLIC;
GRANT EXECUTE ON FUNCTION create_test_story(TEXT, TEXT, BOOLEAN) TO PUBLIC;
GRANT EXECUTE ON FUNCTION cleanup_test_data(TEXT) TO PUBLIC;