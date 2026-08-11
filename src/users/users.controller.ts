import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Owner } from '../auth/decorators/owner.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AutenticatedUser } from '../auth/auth.types';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Criação direta é exclusiva de professor (alunos usam /auth/register)
  @Roles('professor')
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Roles('professor')
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Owner('uid')
  @Get(':uid')
  findOne(@Param('uid') uid: string) {
    return this.usersService.findOne(uid);
  }

  @Owner('uid')
  @Patch(':uid')
  update(
    @Param('uid') uid: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: AutenticatedUser,
  ) {
    // Aluno não pode alterar o próprio role (evita escalada de privilégio)
    if (user.role !== 'professor') {
      updateUserDto.role = undefined;
    }
    return this.usersService.update(uid, updateUserDto);
  }

  @Owner('uid')
  @Delete(':uid')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('uid') uid: string) {
    return this.usersService.remove(uid);
  }
}
