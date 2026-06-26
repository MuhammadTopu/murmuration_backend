import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { DigsService } from './digs.service';
import { CreateDigDto, SaveResponseDto } from './dto/create-dig.dto';
import { UpdateDigDto } from './dto/update-dig.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PaginationDto } from '../../../common/pagination/paginatio.dto';
import { User } from '../user/entities/user.entity';

@Controller('admin/digs')
export class DigsController {
  constructor(private readonly digsService: DigsService) {}




  // evactions

  @UseGuards(JwtAuthGuard)
  @Get('evactions')
  async getAllEvactions(@Req() req: any, @Query() paginationDto: PaginationDto) {
    const userId = req.user?.userId;
    return this.digsService.getAllEvactions(userId, paginationDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('evactions/favorite')
  async getFavoriteEvactions(
    @Req() req: any,
    @Query() paginationDto: PaginationDto,
  ) {
    const userId = req.user?.userId;
    return this.digsService.getFavoriteEvactions(userId, paginationDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('evactions/my')
  async getMyEvactions(
    @Req() req: any,
    @Query() paginationDto: PaginationDto,
  ) {
    const userId = req.user?.userId;
    return this.digsService.getMyEvactions(userId, paginationDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('evactions/favorite/:evactionId')
  async toggleFavoriteEvaction(
    @Param('evactionId') evactionId: string,
    @Req() req: any,
  ) {
    const userId = req.user?.userId;
    return this.digsService.toggleFavoriteEvaction(userId, evactionId);
  }

  // digs

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createDigDto: CreateDigDto, @Req() req: any) {
    const userId = req.user?.userId;
    return this.digsService.create(userId, createDigDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('points')
  async getPoints(@Req() req: any) {
    const userId = req.user?.userId;
    return this.digsService.getPointsdict(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('response/:digId')
  async respondToDig(
    @Param('digId') digId: string,
    @Req() req: any,
    @Body() body: SaveResponseDto,
  ) {
    const userId = req.user?.userId;

    if (!body.answers || !Array.isArray(body.answers)) {
      throw new BadRequestException('Answers must be provided as an array');
    }

    return this.digsService.saveUserResponses(userId, digId, body.answers);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.digsService.getSingleDig(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Req() req: any, @Query() paginationDto: PaginationDto) {
    const userId = req.user?.userId;
    return this.digsService.getAlldigs(userId, paginationDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update/:id')
  async updateDig(
    @Param('id') id: string,
    @Req() req: any,
    @Body() updateDig: UpdateDigDto,
  ) {
    const userId = req.user.userId;
    return await this.digsService.updateDig(id, userId, updateDig);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  async deleteDig(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;
    return await this.digsService.deleteDig(id, userId);
  }
}
