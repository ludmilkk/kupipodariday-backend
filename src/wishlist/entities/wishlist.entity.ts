import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { IsNotEmpty, IsOptional, IsUrl, Length } from 'class-validator';
import { User } from '../../users/entities/user.entity';
import { Wish } from '../../wishes/entities/wish.entity';

@Entity()
export class Wishlist {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  @IsNotEmpty()
  @Length(1, 250)
  name: string;

  @Column()
  @IsNotEmpty()
  @IsUrl()
  image: string;

  @Column({ nullable: true })
  @IsOptional()
  @Length(1, 1500)
  description: string;

  @ManyToMany(() => Wish)
  @JoinTable()
  items: Wish[];

  @ManyToOne(() => User, (user) => user.wishlists)
  @JoinColumn()
  @IsNotEmpty()
  owner: User;
}
