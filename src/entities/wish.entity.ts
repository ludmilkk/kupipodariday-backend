import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Wishlist } from '../entities/wishlist.entity';
import { Offer } from '../entities/offer.entity';
import { User } from '../entities/user.entity';

@Entity('wishes')
export class Wish {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 250 })
  name: string;

  @Column({ type: 'varchar', length: 1024 })
  description: string;

  @Column({ type: 'varchar', length: 500 })
  link: string;

  @Column({ type: 'varchar', length: 500 })
  image: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  raised: number;

  @Column({ type: 'int', default: 0 })
  copied: number;

  @ManyToOne(() => User, (user) => user.wishes)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @Column()
  ownerId: number;

  @ManyToOne(() => Wishlist, (wishlist) => wishlist.items)
  @JoinColumn({ name: 'wishlistId' })
  wishlist: Wishlist;

  @Column()
  wishlistId: number;

  @OneToMany(() => Offer, (offer) => offer.item)
  offers: Offer[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
