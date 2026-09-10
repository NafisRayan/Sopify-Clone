import { Injectable, Module } from '@nestjs/common'
import { Resolver, Query, Args } from '@nestjs/graphql'
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaModule } from '../../prisma/prisma.module'

@Injectable()
export class FinancesService {
  constructor(private prisma: PrismaService) {}

  async payouts() {
    return this.prisma.payout.findMany({ orderBy: { issuedAt: 'desc' } })
  }

  async balanceTransactions(type?: string, first = 100) {
    return this.prisma.balanceTransaction.findMany({
      where: type ? { type } : undefined,
      orderBy: { at: 'desc' },
      take: first,
    })
  }
}

@Resolver('Payout')
export class FinancesResolver {
  constructor(private readonly service: FinancesService) {}

  @Query()
  payouts() {
    return this.service.payouts()
  }

  @Query()
  balanceTransactions(@Args('type', { nullable: true }) type?: string, @Args('first', { nullable: true }) first?: number) {
    return this.service.balanceTransactions(type, first ?? 100)
  }
}

@Module({
  imports: [PrismaModule],
  providers: [FinancesResolver, FinancesService],
})
export class FinancesModule {}
