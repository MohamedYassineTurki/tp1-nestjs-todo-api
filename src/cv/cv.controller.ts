import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { CvService } from './cv.service';
import { CreateCvDto } from './dto/create-cv.dto';
import { UpdateCvDto } from './dto/update-cv.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';
import type { User } from '../user/entities/user.entity';

type CvRequest = Request & { user: Pick<User, 'id' | 'role'> };

@Controller('cv')
@UseGuards(JwtAuthGuard)
export class CvController {
  constructor(private readonly cvService: CvService) {}

  @Post()
  create(@Body() dto: CreateCvDto, @Req() req: CvRequest) {
    return this.cvService.create({ ...dto, userId: req.user.id });
  }

  @Get()
  findAll(@Req() req: CvRequest) {
    return this.cvService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: CvRequest) {
    return this.cvService.find(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCvDto,
    @Req() req: CvRequest,
  ) {
    return this.cvService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: CvRequest) {
    return this.cvService.remove(id, req.user.id);
  }
}
