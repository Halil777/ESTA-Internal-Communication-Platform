import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private departmentsRepo: Repository<Department>,
  ) {}

  async findAll() {
    return this.departmentsRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const dept = await this.departmentsRepo.findOne({ where: { id } });
    if (!dept) throw new NotFoundException(`Department ${id} not found`);
    return dept;
  }

  async create(dto: CreateDepartmentDto) {
    const existing = await this.departmentsRepo.findOne({
      where: [{ name: dto.name }, { code: dto.code }],
    });
    if (existing) {
      throw new ConflictException(
        'Department with this name or code already exists',
      );
    }
    const dept = this.departmentsRepo.create(dto);
    return this.departmentsRepo.save(dept);
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    const dept = await this.findOne(id);
    Object.assign(dept, dto);
    return this.departmentsRepo.save(dept);
  }

  async remove(id: string) {
    const dept = await this.findOne(id);
    dept.isActive = false;
    return this.departmentsRepo.save(dept);
  }

  async getUsersByDepartment(id: string) {
    const dept = await this.departmentsRepo.findOne({
      where: { id },
      relations: ['users', 'users.extension'],
    });
    if (!dept) throw new NotFoundException(`Department ${id} not found`);
    return dept.users.filter((u) => u.isActive);
  }
}
