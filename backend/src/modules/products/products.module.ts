import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { ProductsResolver } from './products.resolver'
import { ProductsService } from './products.service'

@Module({
  imports: [PrismaModule],
  providers: [ProductsResolver, ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
