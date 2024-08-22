import { generatedKey } from '@/common/generatedKey';
import { User } from '@/database/entity';
import { Injectable } from '@nestjs/common';
import _ from 'lodash';
import { Repository } from 'typeorm';

@Injectable()
export class GenerateEntityHelper {
  constructor() {}

  async genId(repository: Repository<User>, table: string) {
    let id = generatedKey.ref(32);
    let flag = true;
    let entitys = repository.createQueryBuilder(table);
    while (flag) {
      const entity = await entitys.where({ id }).getOne();
      if (entity) {
        id = generatedKey.ref(32);
      } else {
        break;
      }
    }

    return id;
  }
  //let id = await this.generateEntity.genId(this.userRepository, 'users');
}
