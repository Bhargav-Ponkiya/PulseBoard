import { SetMetadata } from '@nestjs/common';

/**
 * Marks a route as public (no JWT required)
 */
export const Public = () => SetMetadata('isPublic', true);
