import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @Matches(/^[\w.-]+\/[\w.-]+$/, {
    message: 'githubRepo must be in owner/repo format (e.g. my-org/my-repo)',
  })
  githubRepo?: string;
}
