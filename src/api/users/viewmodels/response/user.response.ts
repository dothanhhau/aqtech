import { AutoMap } from '@automapper/classes';
import { Exclude } from 'class-transformer';

export class ResponseUser {
  @AutoMap()
  id: string;

  @AutoMap()
  username: string;

  @AutoMap()
  phone: string;

  @AutoMap()
  last_login_date: Date;

  @AutoMap()
  fullname: string;

  @AutoMap()
  address: string;

  @AutoMap()
  birthday?: Date;

  @AutoMap()
  email: string;

  @AutoMap()
  type: string;

  @AutoMap()
  avatar: string;

  @AutoMap()
  full_avatar: string;

  @AutoMap()
  job: string;

  @AutoMap()
  is_need_change_password: boolean;

  @AutoMap()
  language?: string;

  @AutoMap()
  roles?: string[];

  @AutoMap()
  Socials: string[]

  @Exclude()
  password: string;

  active_date: Date;

  @AutoMap()
  create_date: Date;

  @AutoMap()
  gender?: string;

  @AutoMap()
  marriage?: string;

  @AutoMap()
  birth_place?: string;

  code?: string;

  active: boolean;
}

export class ResponseKOLDetail {
  passion: string;
  target_audience: string;
  audience_gender: string;
  introduce: string;
  attention: string;
  story: string;
  drama_scandal: string;
  note: string;
}