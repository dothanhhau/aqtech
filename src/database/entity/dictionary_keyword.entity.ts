import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Dictionary } from './dictionary.entity';

@Entity({ name: 'dictionary_keywords' })
export class DictionaryKeywords extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  keyword: string;

  @OneToMany(() => Dictionary, (dictionary) => dictionary.keyword)
  translations: Dictionary[];
}
