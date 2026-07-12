import { prisma } from '../prisma/client';
import { RegisterInput, LoginInput } from '../validators/auth.validator';
import { hashPassword, comparePassword } from '../utils/hash';
import { signToken } from '../utils/jwt';
import { ApiError } from '../utils/api-error';
import { Role } from '@prisma/client';

export interface AuthSuccessPayload {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
  };
  token: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export class AuthService {
  /**
   * Registers a new user in the database.
   */
  async register(input: RegisterInput): Promise<UserResponse> {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw ApiError.badRequest('A user with this email address already exists');
    }

    const hashedPassword = await hashPassword(input.password);

    const newUser = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: hashedPassword,
        role: input.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return newUser;
  }

  /**
   * Authenticates a user and returns their user profile and JWT.
   */
  async login(input: LoginInput): Promise<AuthSuccessPayload> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      // Avoid revealing too much specific information about whether the email exists for safety
      throw ApiError.unauthorized('Invalid email or password credential combination');
    }

    const isPasswordValid = await comparePassword(input.password, user.password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid email or password credential combination');
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    };
  }
}
