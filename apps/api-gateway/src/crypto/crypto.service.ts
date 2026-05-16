import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const raw = this.configService.getOrThrow<string>('ENCRYPTION_KEY');
    if (Buffer.byteLength(raw, 'utf8') < 32) {
      throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
    }
    this.key = Buffer.from(raw, 'utf8').slice(0, 32);
  }

  /** Encrypt a plaintext string using AES-256-CBC with a random IV */
  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /** Decrypt a previously encrypted string using AES-256-CBC */
  decrypt(encrypted: string): string {
    const parts = encrypted.split(':');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error('Invalid encrypted string format');
    }
    const iv = Buffer.from(parts[0], 'hex');
    const data = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, iv);
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
