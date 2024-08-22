import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Language, User } from '.';

@Entity('user_language')
export class UserLanguage extends BaseEntity {
  @Column({ type: 'varchar', length: 32, nullable: true })
  user_id: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  language_id: string;

  @ManyToOne(() => User, (user) => user.userLanguages)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Language, (language) => language.userLanguages)
  @JoinColumn({ name: 'language_id' })
  language: Language;
}
