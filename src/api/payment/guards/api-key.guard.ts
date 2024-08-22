import { SettingService } from '@/api/setting/services/setting.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private reflector: Reflector, private settingService: SettingService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const apiKey = request.headers['X-API-KEY'.toLowerCase()];
    const setting = await this.settingService.system();
    const edubillConfig = JSON.parse(setting.edubill_config);

    if (apiKey && apiKey === edubillConfig.EDU_API_KEY) {
      return true;
    } else {
      return false;
    }
  }
}
