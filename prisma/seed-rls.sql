-- First, ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_business_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;

-- For now, let's create simple policies that allow all authenticated users
-- We'll refine these once auth is properly set up

-- Users policies
CREATE POLICY "Enable all for authenticated users on users" ON users
    FOR ALL USING (auth.role() = 'authenticated');

-- Businesses policies  
CREATE POLICY "Enable read for all on businesses" ON businesses
    FOR SELECT USING (true);

CREATE POLICY "Enable all for authenticated on businesses" ON businesses
    FOR ALL USING (auth.role() = 'authenticated');

-- Services policies
CREATE POLICY "Enable read for all on services" ON services
    FOR SELECT USING (true);

CREATE POLICY "Enable all for authenticated on services" ON services
    FOR ALL USING (auth.role() = 'authenticated');

-- Customers policies
CREATE POLICY "Enable all for authenticated on customers" ON customers
    FOR ALL USING (auth.role() = 'authenticated');

-- Appointments policies
CREATE POLICY "Enable insert for all on appointments" ON appointments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable all for authenticated on appointments" ON appointments
    FOR ALL USING (auth.role() = 'authenticated');

-- Business hours policies
CREATE POLICY "Enable read for all on business_hours" ON business_hours
    FOR SELECT USING (true);

CREATE POLICY "Enable all for authenticated on business_hours" ON business_hours
    FOR ALL USING (auth.role() = 'authenticated');

-- User business roles policies
CREATE POLICY "Enable all for authenticated on user_business_roles" ON user_business_roles
    FOR ALL USING (auth.role() = 'authenticated');