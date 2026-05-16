import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsBoolean } from 'class-validator';
import { CreateAlertChannelDto } from './create-alert-channel.dto';

export class UpdateAlertChannelDto extends PartialType(CreateAlertChannelDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
