import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto, ResetPasswordDto, UpdateUserDto } from './dto/user.dto';
import { ExtensionsService } from '../extensions/extensions.service';
import { SipService } from '../sip/sip.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private extensionsService: ExtensionsService,
    private sipService: SipService,
    private wsGateway: WebsocketGateway,
  ) {}

  async findAll() {
    return this.usersRepo.find({
      relations: ['extension', 'department'],
      order: { firstName: 'ASC', lastName: 'ASC' },
    });
  }

  async findOne(id: string) {
    const user = await this.usersRepo.findOne({
      where: { id },
      relations: ['extension', 'department'],
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findByUsername(username: string) {
    return this.usersRepo.findOne({ where: { username } });
  }

  async create(dto: CreateUserDto) {
    // Check unique username
    const existingUsername = await this.usersRepo.findOne({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new ConflictException(
        `Username "${dto.username}" is already taken`,
      );
    }

    // Check unique employeeId
    const existingEmpId = await this.usersRepo.findOne({
      where: { employeeId: dto.employeeId },
    });
    if (existingEmpId) {
      throw new ConflictException(
        `Employee ID "${dto.employeeId}" is already in use`,
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = this.usersRepo.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      username: dto.username,
      employeeId: dto.employeeId,
      email: dto.email,
      passwordHash,
      role: dto.role ?? UserRole.EMPLOYEE,
      departmentId: dto.departmentId,
      cabinet: dto.cabinet,
    });
    const savedUser = await this.usersRepo.save(user);

    // Assign extension if provided
    if (dto.extensionNumber) {
      await this.extensionsService.assign({
        extensionNumber: dto.extensionNumber,
        userId: savedUser.id,
      });
    }

    return this.findOne(savedUser.id);
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findOne(id);
    const { extensionNumber, password, ...profileDto } = dto;
    const updateDto: Partial<User> = { ...profileDto };

    if (dto.username && dto.username !== user.username) {
      const existing = await this.usersRepo.findOne({
        where: { username: dto.username },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Username "${dto.username}" is already taken`,
        );
      }
    }

    if (dto.employeeId && dto.employeeId !== user.employeeId) {
      const existing = await this.usersRepo.findOne({
        where: { employeeId: dto.employeeId },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Employee ID "${dto.employeeId}" is already in use`,
        );
      }
    }

    if (profileDto.departmentId === '') updateDto.departmentId = null;
    if (profileDto.email === '') updateDto.email = null;
    if (profileDto.cabinet === '') updateDto.cabinet = null;

    if (password) {
      updateDto.passwordHash = await bcrypt.hash(password, 12);
    }

    Object.assign(user, updateDto);
    await this.usersRepo.save(user);

    if (extensionNumber !== undefined) {
      const normalizedExtension = extensionNumber.trim();
      const currentExtension = user.extension?.extensionNumber;

      if (!normalizedExtension && currentExtension) {
        await this.extensionsService.release(currentExtension);
      } else if (
        normalizedExtension &&
        normalizedExtension !== currentExtension
      ) {
        await this.extensionsService.assign({
          extensionNumber: normalizedExtension,
          userId: id,
        });
      }
    }

    return this.findOne(id);
  }

  async resetPassword(id: string, dto: ResetPasswordDto) {
    const user = await this.findOne(id);
    user.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.usersRepo.save(user);
  }

  async deactivate(id: string) {
    const user = await this.findOne(id);
    user.isActive = false;
    await this.usersRepo.save(user);
    this.wsGateway.emitUserOffline(id);
  }

  async activate(id: string) {
    const user = await this.findOne(id);
    user.isActive = true;
    return this.usersRepo.save(user);
  }

  async remove(id: string, currentUserId: string) {
    if (id === currentUserId) {
      throw new BadRequestException('You cannot delete your own user account');
    }

    const user = await this.findOne(id);
    if (user.extension?.extensionNumber) {
      await this.extensionsService.release(user.extension.extensionNumber);
    } else {
      await this.sipService.removeAccount(id);
    }

    await this.usersRepo.delete(id);
    this.wsGateway.emitUserOffline(id);
  }

  async getMe(userId: string) {
    return this.findOne(userId);
  }

  async generateActivationCode(userId: string): Promise<string> {
    const user = await this.findOne(userId);
    // Simple format: ESTA-{userId}-{random6}
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ESTA-${user.id}-${random}`;
  }
}
