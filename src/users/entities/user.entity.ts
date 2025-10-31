import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  Length,
} from 'class-validator';
import { Wish } from '../../wishes/entities/wish.entity';
import { Wishlist } from '../../wishlist/entities/wishlist.entity';
import { Offer } from '../../offers/entities/offer.entity';

const DEFAULT_ABOUT = 'Пока ничего не рассказал о себе';
const DEFAULT_AVATAR = 'https://i.pravatar.cc/300';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ unique: true })
  @IsNotEmpty()
  @Length(2, 30)
  username: string;

  @Column({ default: DEFAULT_ABOUT })
  @IsOptional()
  @Length(2, 200)
  about: string;

  @Column({ default: DEFAULT_AVATAR })
  @IsOptional()
  @IsUrl()
  avatar: string;

  @Column({ unique: true, select: false })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Column({ select: false })
  @IsNotEmpty()
  password: string;

  @OneToMany(() => Wish, (wish) => wish.owner)
  wishes: Wish[];

  @OneToMany(() => Wishlist, (wishlist) => wishlist.owner)
  wishlists: Wishlist[];

  @OneToMany(() => Offer, (offer) => offer.user)
  offers: Offer[];
}
