import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard, CurrentUser } from '@app/common';
import { AlertChannelsService } from './alert-channels.service';
import { CreateAlertChannelDto } from './dto/create-alert-channel.dto';
import { UpdateAlertChannelDto } from './dto/update-alert-channel.dto';

@UseGuards(JwtGuard)
@Controller('projects/:projectId/alert-channels')
export class AlertChannelsController {
  constructor(private readonly service: AlertChannelsService) {}

  @Get()
  findAll(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
  ) {
    return this.service.findAll(user.id, projectId);
  }

  @Post()
  create(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Body() dto: CreateAlertChannelDto,
  ) {
    return this.service.create(user.id, projectId, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAlertChannelDto,
  ) {
    return this.service.update(user.id, projectId, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.service.remove(user.id, projectId, id);
  }

  @Post('test')
  async test(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Body() dto: CreateAlertChannelDto,
  ) {
    return this.service.test(user.id, projectId, dto);
  }
}
