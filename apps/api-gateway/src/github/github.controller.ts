import { Controller, Get, Post, Delete, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtGuard, CurrentUser } from '@app/common';
import { GithubService } from './github.service';
import { SaveGithubTokenDto } from './dto/save-github-token.dto';

@UseGuards(JwtGuard)
@Controller('github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @Get('status')
  getStatus(@CurrentUser() user: { id: string }) {
    return this.githubService.getStatus(user.id);
  }

  @Post('validate')
  async validateToken(@Body() dto: SaveGithubTokenDto) {
    const isValid = await this.githubService.validateToken(dto.token);
    if (!isValid) {
      throw new BadRequestException('Invalid GitHub token or insufficient scopes');
    }
    return { valid: true };
  }

  @Post('token')
  async saveToken(
    @CurrentUser() user: { id: string },
    @Body() dto: SaveGithubTokenDto,
  ) {
    const isValid = await this.githubService.validateToken(dto.token);
    if (!isValid) {
      throw new BadRequestException('Invalid GitHub token or insufficient scopes');
    }
    await this.githubService.saveToken(user.id, dto.token);
    return { success: true };
  }

  @Delete('token')
  async deleteToken(@CurrentUser() user: { id: string }) {
    await this.githubService.deleteToken(user.id);
    return { success: true };
  }
}
