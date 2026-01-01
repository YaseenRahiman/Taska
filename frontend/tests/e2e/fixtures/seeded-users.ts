/**
 * Seeded Users from backend/prisma/seed.ts
 * Pre-created users that can be used for testing without registration
 */

export const SEEDED_USERS = {
  admin: {
    email: 'admin@taska.co.za',
    password: 'Admin123!',  // Must match backend/prisma/seed.ts
    role: 'ADMIN' as const,
  },

  clients: [
    {
      email: 'john.smith@example.com',
      password: 'Password123!',  // Must match backend/prisma/seed.ts
      role: 'CLIENT' as const,
      firstName: 'John',
      lastName: 'Smith',
      phoneNumber: '+27821234567',
    },
    {
      email: 'sarah.jones@example.com',
      password: 'Password123!',  // Must match backend/prisma/seed.ts
      role: 'CLIENT' as const,
      firstName: 'Sarah',
      lastName: 'Jones',
      phoneNumber: '+27827654321',
    },
    {
      email: 'mike.brown@example.com',
      password: 'Password123!',  // Must match backend/prisma/seed.ts
      role: 'CLIENT' as const,
      firstName: 'Mike',
      lastName: 'Brown',
      phoneNumber: '+27831112222',
    },
  ],

  artisans: [
    {
      email: 'david.plumber@example.com',
      password: 'Password123!',  // Must match backend/prisma/seed.ts
      role: 'ARTISAN' as const,
      firstName: 'David',
      lastName: 'Wilson',
      phoneNumber: '+27843334444',
      category: 'Plumbing',
    },
    {
      email: 'lisa.electrician@example.com',
      password: 'Password123!',  // Must match backend/prisma/seed.ts
      role: 'ARTISAN' as const,
      firstName: 'Lisa',
      lastName: 'Taylor',
      phoneNumber: '+27855556666',
      category: 'Electrical',
    },
    {
      email: 'tom.carpenter@example.com',
      password: 'Password123!',  // Must match backend/prisma/seed.ts
      role: 'ARTISAN' as const,
      firstName: 'Tom',
      lastName: 'Anderson',
      phoneNumber: '+27867778888',
      category: 'Carpentry',
    },
    {
      email: 'alex.developer@example.com',
      password: 'Password123!',  // Must match backend/prisma/seed.ts
      role: 'ARTISAN' as const,
      firstName: 'Alex',
      lastName: 'Johnson',
      phoneNumber: '+27879990000',
      category: 'Web Development',
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
