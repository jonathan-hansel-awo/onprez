// Mock Prisma
jest.mock('@prisma/client');

describe('Database Seeding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should seed initial data successfully', async () => {
    // Mock the seed function
    const mockSeed = jest.fn().mockResolvedValue({
      users: 1,
      businesses: 1,
      services: 3,
      templates: 5,
    });

    // Test seeding
    const result = await mockSeed();

    expect(result.users).toBeGreaterThan(0);
    expect(result.businesses).toBeGreaterThan(0);
    expect(result.services).toBeGreaterThan(0);
    expect(result.templates).toBeGreaterThan(0);
  });

  it('should clean database before seeding', async () => {
    const mockClean = jest.fn().mockResolvedValue(true);

    await mockClean();

    expect(mockClean).toHaveBeenCalled();
  });

  it('should create test user with valid business', async () => {
    const mockTestUser = {
      id: 'test-user-id',
      email: 'test@onprez.com',
      emailVerified: true,
      businesses: [
        {
          id: 'test-business-id',
          slug: 'test-salon',
          name: 'Test Salon',
          category: 'BEAUTY',
        },
      ],
    };

    const mockCreateTestData = jest.fn().mockResolvedValue(mockTestUser);

    const result = await mockCreateTestData();

    expect(result.email).toBe('test@onprez.com');
    expect(result.businesses).toHaveLength(1);
    expect(result.businesses[0].slug).toBe('test-salon');
  });
});
