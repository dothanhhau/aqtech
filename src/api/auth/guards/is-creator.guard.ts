import { ErrorCode } from '@/common/exceptions/error-code.exception';
import { UserPayload } from '@/shared/http/request.interface';
import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../../users/services/users.service';

@Injectable()
export class IsCreatorGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private usersService: UsersService) {}
  async canActivate(context: ExecutionContext): Promise<any> {
    const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user }: { user: UserPayload; params: { id: number } } = request;
    const hasUser = await this.usersService.checkUserExist(user);
    if (!hasUser) throw new HttpException(ErrorCode.user_not_existed, HttpStatus.NOT_FOUND);
    // const token = request.headers.authorization;
    try {
      const hasUserRole = await this.usersService.findUserRole(user.username);
      return hasUserRole ? true : false;
    } catch (e) {
      return false;
    }
  }
}
