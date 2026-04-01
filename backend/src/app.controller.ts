import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** Health check (ex.: Railway, load balancers). Raiz reservada ao SPA em produção. */
  @Get('health')
  getHealth(): string {
    return this.appService.getHello();
  }
}
