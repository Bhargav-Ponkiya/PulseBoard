import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@app/database';
import { GithubController } from './github.controller';
import { GithubService } from './github.service';
import { CryptoService } from '../crypto/crypto.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [GithubController],
  providers: [GithubService, CryptoService],
})
export class GithubModule {}
