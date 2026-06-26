import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { PlansService } from './plans.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateAdDto } from './dto/create-add.dto';

@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  // @Post()
  // create(@Body() createPlanDto: CreatePlanDto) {
  //   return this.plansService.create(createPlanDto);
  // }

  @Get()
  async findAll() {
    return this.plansService.getPlans();
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  async checkout(
    @Body() body: { planId: string; confirmed?: boolean },
    @Req() req: any,
  ) {
    const userId = req.user.userId;
    const { planId, confirmed } = body;

    console.log(body);

    return this.plansService.checkoutSession(userId, planId, confirmed);
  }

  @UseGuards(JwtAuthGuard)
  @Post('add')
  @UseInterceptors(FileInterceptor('image'))
  async createAdd(
    @Req() req: any,
    @Body() createAdDto: CreateAdDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    const userId = req.user?.userId;

    return this.plansService.createAdd(userId, createAdDto, image);
  }

  // @UseGuards(JwtAuthGuard)
  @Get('ads')
  async getAds() {
    return this.plansService.getAds();
  }

  @Get('ads/:id')
  async getAdById(@Param('id') id: string) {
    return this.plansService.getAdById(id);
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.plansService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updatePlanDto: UpdatePlanDto) {
  //   return this.plansService.update(+id, updatePlanDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.plansService.remove(+id);
  // }
}
