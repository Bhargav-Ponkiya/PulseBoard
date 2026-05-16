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
import { MonitorsService } from './monitors.service';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';

@UseGuards(JwtGuard)
@Controller('projects/:projectId/monitors')
export class MonitorsController {
  constructor(private readonly monitorsService: MonitorsService) {}

  @Get()
  findAll(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
  ) {
    return this.monitorsService.findAll(projectId, user.id);
  }

  @Post()
  create(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Body() dto: CreateMonitorDto,
  ) {
    return this.monitorsService.create(user.id, projectId, dto);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.monitorsService.findOne(projectId, id, user.id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMonitorDto,
  ) {
    return this.monitorsService.update(user.id, projectId, id, dto);
  }

  @Delete(':id')
  async delete(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    await this.monitorsService.delete(user.id, projectId, id);
    return { success: true };
  }

  @Post(':id/toggle')
  toggle(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.monitorsService.toggle(user.id, projectId, id);
  }

  @Post(':id/check')
  triggerCheck(
    @CurrentUser() user: { id: string },
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.monitorsService.triggerCheck(user.id, projectId, id);
  }
}
