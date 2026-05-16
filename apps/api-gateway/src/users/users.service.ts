import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, Project, Metric, Log } from '@app/database';
import * as bcrypt from 'bcryptjs';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectModel(Metric.name)
    private readonly metricModel: Model<Metric>,
    @InjectModel(Log.name)
    private readonly logModel: Model<Log>,
  ) {}

  /** Get the profile for the given user */
  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'name', 'createdAt', 'isActive'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /** Update the profile (name/email) for the given user */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account is deactivated');
    }

    if (dto.email) {
      const existing = await this.userRepository.findOne({
        where: { email: dto.email },
      });
      if (existing && existing.id !== userId) {
        throw new BadRequestException('Email is already in use');
      }
    }

    await this.userRepository.update(userId, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.email !== undefined && { email: dto.email }),
    });

    return this.getProfile(userId);
  }

  /** Change the user's password after verifying the current password */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'passwordHash', 'isActive'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Account is deactivated');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash ?? '');
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (dto.newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 12);
    await this.userRepository.update(userId, { passwordHash: newHash });

    return { success: true };
  }

  /** Temporarily disable an account */
  async deactivateAccount(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.userRepository.update(userId, { isActive: false, refreshTokenHash: null });
    this.logger.log(`Account deactivated: ${userId}`);
    return { success: true, message: 'Account has been deactivated.' };
  }

  /** Permanently delete account and all associated telemetry data */
  async deleteAccount(userId: string) {
    const user = await this.userRepository.findOne({ 
      where: { id: userId },
      relations: ['projects'],
    });
    if (!user) throw new NotFoundException('User not found');

    const projectIds = user.projects.map(p => p.id);
    
    // 1. Wipe telemetry from MongoDB
    if (projectIds.length > 0) {
      await Promise.all([
        this.metricModel.deleteMany({ projectId: { $in: projectIds } }),
        this.logModel.deleteMany({ projectId: { $in: projectIds } }),
      ]);
      this.logger.log(`Wiped telemetry for user ${userId} (${projectIds.length} projects)`);
    }

    // 2. Delete user from Postgres (cascades to projects, monitors, incidents)
    await this.userRepository.remove(user);
    
    this.logger.warn(`Permanently deleted user account: ${userId}`);
    return { success: true, message: 'Account and all data have been permanently deleted.' };
  }
}
