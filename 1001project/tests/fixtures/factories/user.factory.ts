import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

export type UserRole = 'LEARNER' | 'TEACHER' | 'INSTITUTION' | 'VOLUNTEER' | 'ADMIN';

export interface TestUser {
  id?: string;
  email: string;
  password: string;
  passwordHash?: string;
  name: string;
  role: UserRole;
  emailVerified: boolean;
  isActive: boolean;
  locale: 'en' | 'ko';
  demoMode: boolean;
  profileImage?: string;
  createdAt?: Date;
  lastLogin?: Date;
}

export class UserFactory {
  private static defaultPassword = 'TestPass123!';
  
  /**
   * Create a single test user with specified role
   */
  static async create(role: UserRole, overrides?: Partial<TestUser>): Promise<TestUser> {
    const password = overrides?.password || this.defaultPassword;
    const passwordHash = await bcrypt.hash(password, 10);
    
    const user: TestUser = {
      id: faker.string.uuid(),
      email: overrides?.email || faker.internet.email().toLowerCase(),
      password: password,
      passwordHash: passwordHash,
      name: overrides?.name || faker.person.fullName(),
      role: role,
      emailVerified: overrides?.emailVerified ?? true,
      isActive: overrides?.isActive ?? true,
      locale: overrides?.locale || 'en',
      demoMode: overrides?.demoMode ?? false,
      profileImage: faker.image.avatar(),
      createdAt: new Date(),
      lastLogin: faker.date.recent(),
      ...overrides
    };
    
    return user;
  }
  
  /**
   * Create multiple test users
   */
  static async createMany(count: number, role: UserRole): Promise<TestUser[]> {
    const users: TestUser[] = [];
    for (let i = 0; i < count; i++) {
      users.push(await this.create(role));
    }
    return users;
  }
  
  /**
   * Create a complete set of test users (one for each role)
   */
  static async createTestSet(): Promise<Record<UserRole, TestUser>> {
    return {
      LEARNER: await this.create('LEARNER', {
        email: 'test.learner@1001stories.test',
        name: 'Test Learner'
      }),
      TEACHER: await this.create('TEACHER', {
        email: 'test.teacher@1001stories.test',
        name: 'Test Teacher'
      }),
      INSTITUTION: await this.create('INSTITUTION', {
        email: 'test.institution@1001stories.test',
        name: 'Test Institution Admin'
      }),
      VOLUNTEER: await this.create('VOLUNTEER', {
        email: 'test.volunteer@1001stories.test',
        name: 'Test Volunteer'
      }),
      ADMIN: await this.create('ADMIN', {
        email: 'test.admin@1001stories.test',
        name: 'Test Admin'
      })
    };
  }
  
  /**
   * Create demo mode users
   */
  static async createDemoUsers(): Promise<TestUser[]> {
    const roles: UserRole[] = ['LEARNER', 'TEACHER', 'INSTITUTION', 'VOLUNTEER'];
    const demoUsers: TestUser[] = [];
    
    for (const role of roles) {
      demoUsers.push(await this.create(role, {
        email: `demo.${role.toLowerCase()}@1001stories.test`,
        name: `Demo ${role.charAt(0) + role.slice(1).toLowerCase()}`,
        demoMode: true,
        password: 'DemoPass123!'
      }));
    }
    
    return demoUsers;
  }
  
  /**
   * Generate user with specific locale
   */
  static async createKoreanUser(role: UserRole): Promise<TestUser> {
    return this.create(role, {
      name: faker.person.fullName(),
      locale: 'ko',
      email: `kr.${faker.internet.userName()}@1001stories.test`.toLowerCase()
    });
  }
  
  /**
   * Create inactive user for testing
   */
  static async createInactiveUser(role: UserRole): Promise<TestUser> {
    return this.create(role, {
      isActive: false,
      email: `inactive.${faker.internet.userName()}@1001stories.test`.toLowerCase()
    });
  }
  
  /**
   * Create unverified user for testing email verification
   */
  static async createUnverifiedUser(role: UserRole): Promise<TestUser> {
    return this.create(role, {
      emailVerified: false,
      email: `unverified.${faker.internet.userName()}@1001stories.test`.toLowerCase()
    });
  }
}