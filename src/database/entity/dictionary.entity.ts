import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DictionaryKeywords } from './dictionary_keyword.entity';
import { Language } from './language.entity';

@Entity({ name: 'dictionary' })
export class Dictionary extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  translation: string;

  @ManyToOne(() => Language, (language) => language.userLanguages, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'language_id' })
  language!: Language;

  @ManyToOne(() => DictionaryKeywords, (dictionaryKeyword) => dictionaryKeyword.translations, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'keyword_id' })
  keyword!: DictionaryKeywords;
}
