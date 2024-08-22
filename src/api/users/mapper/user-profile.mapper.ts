import { createMap, Mapper } from '@automapper/core';
import { AutomapperProfile, InjectMapper } from '@automapper/nestjs';
import { Injectable } from '@nestjs/common';
import { ResponseKOLDetail, ResponseUser } from '../viewmodels/response/user.response';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UserProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      // createMap(mapper, User, ResponseUser);
      // createMap(mapper, ResponseUser, User);
    };
  }
}

export function mapUserToPersonal(a: any): ResponseUser {
  return plainToInstance(ResponseUser, {
    id: a.id,
    username: a.username,
    phone: a.phone,
    fullname: a.fullname,
    address: a.address,
    birthday: a.birthday,
    email: a.email,
    avatar: a.avatar,
    full_avatar: a.full_avatar,
    job: a.job,
    gender: a.gender,
    marriage: a.marriage,
    birth_place: a.birth_place,
  });
}

export function mapUserToKOLDetail(a: any): ResponseKOLDetail {
  return plainToInstance(ResponseKOLDetail, {
    passion: a.passion,
    target_audience: a.target_audience,
    audience_gender: a.audience_gender,
    introduce: a.introduce,
    attention: a.attention,
    story: a.story,
    drama_scandal: a.drama_scandal,
    note: a.note,
  });
}