import { generatedKey } from '@/common/generatedKey';
import { Device } from '@/database/entity';
import { ErrorCode } from '@/common/exceptions/error-code.exception';
import { UserPayload } from '@/shared/http/request.interface';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDeviceDto } from '../dto/create-device.dto';

@Injectable()
export class DeviceService {
  constructor(@InjectRepository(Device, 'postgres') private readonly deviceRepository: Repository<Device>) {}

  // Create device
  async create(user: UserPayload, createDeviceDto: CreateDeviceDto) {
    let device = await this.deviceRepository.findOneBy({ user_id: user.userId, push_key: createDeviceDto.push_key });
    if (!!device) await this.deviceRepository.remove(device);
    try {
      device = this.deviceRepository.create({
        ...createDeviceDto,
        id: generatedKey.ref(32),
        user_id: user.userId,
      });

      await this.deviceRepository.save(device);
      return device;
    } catch (error) {
      throw new HttpException(ErrorCode.create_social_unsuccessful, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Find device
  async findOne(user: UserPayload, pushKey: string) {
    const device = await this.deviceRepository.findOneBy({ user_id: user.userId, push_key: pushKey });
    if (!device) {
      throw new HttpException(ErrorCode.device_not_existed, HttpStatus.NOT_FOUND);
    }
    return device;
  }

  // Update device
  async updateDevice(user: UserPayload, pushKey: string) {
    try {
      const device = await this.deviceRepository.findOneBy({ user_id: user.userId, push_key: pushKey });
      if (!device) return;
      await this.deviceRepository.save({
        ...device,
        update_date: new Date(),
      });
      this.deviceRepository.create(device);
    } catch (error) {
      throw new HttpException(ErrorCode.update_device_unsuccessful, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Delete device when logout
  async delete(user: UserPayload, pushKey: string) {
    const devices = await this.deviceRepository.findBy({ push_key: pushKey });
    if (devices.length == 0) return;
    await this.deviceRepository.remove(devices);
  }
}
