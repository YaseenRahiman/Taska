/**
 * Seeded Users from backend/prisma/seed.ts
 * Pre-created users that can be used for testing without registration
 */

export const SEEDED_USERS = {
  admin: {
    email: 'admin@taska.co.za',
    password: 'password123',
    role: 'ADMIN' as const,
  },

  clients: [
    {
      email: 'john.smith@example.com',
      password: 'password123',
      role: 'CLIENT' as const,
      firstName: 'John',
      lastName: 'Smith',
      phoneNumber: '+27821234567',
    },
    {
      email: 'sarah.jones@example.com',
      password: 'password123',
      role: 'CLIENT' as const,
      firstName: 'Sarah',
      lastName: 'Jones',
      phoneNumber: '+27822345678',
    },
    {
      email: 'mike.brown@example.com',
      password: 'password123',
      role: 'CLIENT' as const,
      firstName: 'Mike',
      lastName: 'Brown',
      phoneNumber: '+27823456789',
    },
  ],

  artisans: [
    {
      email: 'david.plumber@example.com',
      password: 'password123',
      role: 'ARTISAN' as const,
      firstName: 'David',
      lastName: 'Wilson',
      phoneNumber: '+27824567890',
      category: 'Plumbing',
    },
    {
      email: 'lisa.electrician@example.com',
      password: 'password123',
      role: 'ARTISAN' as const,
      firstName: 'Lisa',
      lastName: 'Anderson',
      phoneNumber: '+27825678901',
      category: 'Electrical',
    },
    {
      email: 'tom.carpenter@example.com',
      password: 'password123',
      role: 'ARTISAN' as const,
      firstName: 'Tom',
      lastName: 'Martinez',
      phoneNumber: '+27826789012',
      category: 'Carpentry',
    },
    {
      email: 'alex.developer@example.com',
      password: 'password123',
      role: 'ARTISAN' as const,
      firstName: 'Alex',
      lastName: 'Garcia',
      phoneNumber: '+27827890123',
      category: 'General',
    },
  ],
};

/**
 * Get a seeded user by role for quick testing
 */
export function getSeededUser(role: 'ADMIN' | 'CLIENT' | 'ARTISAN', index: number = 0) {
  if (role === 'ADMIN') {
    return SEEDED_USERS.admin;
  }

  if (role === 'CLIENT') {
    return SEEDED_USERS.clients[index] || SEEDED_USERS.clients[0];
  }

  if (role === 'ARTISAN') {
    return SEEDED_USERS.artisans[index] || SEEDED_USERS.artisans[0];
  }

  throw new Error(`Invalid role: ${role}`);
}
