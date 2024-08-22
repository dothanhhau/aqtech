import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Dictionary } from './dictionary.entity';
import { UserLanguage } from './user_language.entity';

@Entity({ name: 'languages' })
export class Language extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  language: string;

  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  country_code: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  country_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  flag: string;

  @Column({ type: 'boolean', nullable: true, default: false })
  default: boolean;

  @Column({ type: 'boolean', nullable: true, default: true })
  enable: boolean;

  @OneToMany(() => UserLanguage, (userLanguage) => userLanguage.user)
  userLanguages: UserLanguage[];

  @OneToMany(() => Dictionary, (dictionary) => dictionary.language)
  translations: Dictionary[];
}
