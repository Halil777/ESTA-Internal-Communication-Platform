import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';

@ApiTags('Contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contacts')
export class ContactsController {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all employees as contacts (for directory)' })
  async findAll() {
    const users = await this.usersRepo.find({
      where: { isActive: true },
      relations: ['extension', 'department'],
      order: { firstName: 'ASC', lastName: 'ASC' },
    });
    return users.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      extension: u.extension?.extensionNumber ?? null,
      department: u.department ?? null,
      cabinet: u.cabinet ?? null,
      status: u.status,
      avatarUrl: u.avatarUrl ?? null,
    }));
  }

  @Get('search')
  @ApiOperation({ summary: 'Search contacts by name, extension or department' })
  @ApiQuery({ name: 'q', required: true })
  async search(@Query('q') query: string) {
    if (!query || query.length < 1) return [];
    const users = await this.usersRepo.find({
      where: [
        { firstName: ILike(`%${query}%`), isActive: true },
        { lastName: ILike(`%${query}%`), isActive: true },
      ],
      relations: ['extension', 'department'],
      take: 50,
    });
    return users.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      extension: u.extension?.extensionNumber ?? null,
      department: u.department ?? null,
      cabinet: u.cabinet ?? null,
      status: u.status,
      avatarUrl: u.avatarUrl ?? null,
    }));
  }

  @Get(':extension')
  @ApiOperation({ summary: 'Get contact by extension number' })
  async findByExtension(@Param('extension') extension: string) {
    return this.usersRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.extension', 'extension')
      .leftJoinAndSelect('user.department', 'department')
      .where('extension.extensionNumber = :ext', { ext: extension })
      .andWhere('user.isActive = true')
      .select([
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.status',
        'user.cabinet',
        'user.avatarUrl',
        'extension.extensionNumber',
        'department.id',
        'department.name',
      ])
      .getOne();
  }
}
