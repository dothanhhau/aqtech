import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity({ name: 'media' })
export class Media extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  campaign_id: string;

  @Column({ type: 'varchar', nullable: true })
  campaign_post_id: string;

  @Column({ type: 'varchar', nullable: true })
  customer_id: string;

  @Column({ type: 'varchar', nullable: true })
  brand_id: string;

  @Column({ type: 'text', name: 'file_name', nullable: true })
  file_name: string;

  @Column({ type: 'text', name: 'url_full', nullable: true })
  url_full: string;

  @Column({ type: 'text', name: 'url_thumbnail', nullable: true })
  url_thumbnail: string;

  @Column({ type: 'int', name: 'index', nullable: true })
  index: number;

  @Column({ type: 'varchar', length: 45, nullable: true })
  type: string;

}
