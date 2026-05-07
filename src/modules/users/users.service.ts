import { Injectable } from '@nestjs/common';
import { User } from '@prisma-generated/prisma/client';
import { PrismaService } from '@prisma-service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  findBySlug(slug: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { slug },
    })
  }
}
