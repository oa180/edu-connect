import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findFirst({ where: { email, deletedAt: null } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async login(userId: string, role: string) {
    const accessToken = await this.jwt.signAsync({ sub: userId, role });
    const refreshToken = await this.generateRefreshToken(userId);
    return { accessToken, refreshToken };
  }

  private async generateRefreshToken(userId: string) {
    const secret = process.env.JWT_REFRESH_SECRET as string;
    const expiresIn = process.env.JWT_REFRESH_EXPIRES || '7d';
    const token = await this.jwt.signAsync({ sub: userId, type: 'refresh' }, { secret, expiresIn });
    const payload = this.jwt.decode(token) as any;
    const expSec = payload?.exp ? Number(payload.exp) : Math.floor(Date.now() / 1000) + 7 * 24 * 3600;
    const expiresAt = new Date(expSec * 1000);
    await this.prisma.refreshToken.create({ data: { userId, token, expiresAt } });
    return token;
  }

  async refresh(token: string) {
    const secret = process.env.JWT_REFRESH_SECRET as string;
    try {
      const payload = await this.jwt.verifyAsync(token, { secret });
      const stored = await this.prisma.refreshToken.findUnique({ where: { token } });
      if (!stored || stored.expiresAt < new Date()) throw new ForbiddenException('Invalid refresh token');
      const user = await this.prisma.user.findFirst({ where: { id: payload.sub, deletedAt: null } });
      if (!user) throw new ForbiddenException('User inactive');
      const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role });
      return { accessToken };
    } catch {
      throw new ForbiddenException('Invalid refresh token');
    }
  }

  async logout(token: string) {
    await this.prisma.refreshToken.deleteMany({ where: { token } });
    return { success: true };
  }

  async hashPassword(password: string) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }
}
