import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtGuard, CurrentUser } from '@app/common';
import { IncidentsService } from './incidents.service';

@UseGuards(JwtGuard)
@Controller('projects/:projectId/incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  async findAll(
    @CurrentUser() user: { id: string },
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.incidentsService.findAll(user.id, projectId, page, limit);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: { id: string },
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.incidentsService.findOne(user.id, projectId, id);
  }

  @Patch(':id/resolve')
  async resolve(
    @CurrentUser() user: { id: string },
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.incidentsService.resolve(user.id, projectId, id);
  }
}
