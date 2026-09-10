import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import { BaseExceptionFilter } from '@nestjs/core'

/** Centralized error handling (skill: error-use-exception-filters) */
@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    if (status >= 500) {
      // logged centrally; GraphQL surfaces userErrors for expected failures
      console.error('[Unhandled]', exception)
    }
    super.catch(exception, host)
  }
}
