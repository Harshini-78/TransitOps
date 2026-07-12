import { prisma } from '../prisma/client';
import { CreateDriverInput, UpdateDriverInput } from '../validators/driver.validator';
import { ApiError } from '../utils/api-error';
import { Driver } from '@prisma/client';

export class DriverService {
  async create(input: CreateDriverInput): Promise<Driver> {
    if (new Date(input.licenseExpiry) <= new Date()) {
      throw new ApiError(400, 'Cannot register a driver with an expired license');
    }

    const existingEmail = await prisma.driver.findUnique({
      where: { email: input.email },
    });
    if (existingEmail) {
      throw new ApiError(409, `Driver with email '${input.email}' already exists`);
    }

    const existingLicense = await prisma.driver.findUnique({
      where: { licenseNumber: input.licenseNumber },
    });
    if (existingLicense) {
      throw new ApiError(409, `Driver with license number '${input.licenseNumber}' already exists`);
    }

    return prisma.driver.create({
      data: input,
    });
  }

  async findAll(): Promise<Driver[]> {
    return prisma.driver.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Driver> {
    const driver = await prisma.driver.findUnique({
      where: { id },
    });

    if (!driver) {
      throw ApiError.notFound(`Driver with ID '${id}' not found`);
    }

    return driver;
  }

  async update(id: string, input: UpdateDriverInput): Promise<Driver> {
    const driver = await prisma.driver.findUnique({
      where: { id },
    });

    if (!driver) {
      throw ApiError.notFound(`Driver with ID '${id}' not found`);
    }

    if (input.licenseExpiry && new Date(input.licenseExpiry) <= new Date()) {
      throw new ApiError(400, 'Cannot update a driver with an expired license');
    }

    if (input.email && input.email !== driver.email) {
      const existingEmail = await prisma.driver.findUnique({
        where: { email: input.email },
      });
      if (existingEmail) {
        throw new ApiError(409, `Driver with email '${input.email}' already exists`);
      }
    }

    if (input.licenseNumber && input.licenseNumber !== driver.licenseNumber) {
      const existingLicense = await prisma.driver.findUnique({
        where: { licenseNumber: input.licenseNumber },
      });
      if (existingLicense) {
        throw new ApiError(409, `Driver with license number '${input.licenseNumber}' already exists`);
      }
    }

    return prisma.driver.update({
      where: { id },
      data: input,
    });
  }

  async delete(id: string): Promise<Driver> {
    const driver = await prisma.driver.findUnique({
      where: { id },
    });

    if (!driver) {
      throw ApiError.notFound(`Driver with ID '${id}' not found`);
    }

    return prisma.driver.delete({
      where: { id },
    });
  }
}
