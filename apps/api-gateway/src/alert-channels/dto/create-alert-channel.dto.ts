import { IsString, IsNotEmpty, IsIn, IsUrl, MaxLength } from 'class-validator';

export class CreateAlertChannelDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsIn(['discord', 'slack', 'webhook'])
  type: 'discord' | 'slack' | 'webhook';

  @IsUrl({ require_tld: false })
  @MaxLength(500)
  webhookUrl: string;
}
