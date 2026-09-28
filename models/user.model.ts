import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";
import AppDataSource from "../utils/database.utils";
import type { UserInput, UserOutput } from "../types/user.types";
import { parseId } from "../utils/number.utils";

function userRepository() {
  return AppDataSource.getRepository(User);
}

@Entity({ name: "users" })
class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ type: "varchar", length: 255 })
  password!: string;

  @Column({ type: "varchar", length: 100 })
  firstName!: string;

  @Column({ type: "varchar", length: 100 })
  lastName!: string;

  @CreateDateColumn()
  createdAt!: Date;

  constructor(userData?: UserInput) {
    if (!userData) return;
    this.email = userData.email;
    this.password = userData.password;
    this.firstName = userData.firstName;
    this.lastName = userData.lastName;
  }

  async save(): Promise<User> {
    return userRepository().save(this);
  }

  /** `res.json()` calls this, so the password hash never leaves the API. */
  toJSON(): UserOutput {
    const { password: _password, ...publicUser } = this;
    return publicUser;
  }

  static async update(
    id: number,
    userData: UserInput,
  ): Promise<User | undefined> {
    const user = await userRepository().findOneBy({ id });
    if (!user) {
      return undefined;
    }

    user.email = userData.email;
    user.password = userData.password;
    user.firstName = userData.firstName;
    user.lastName = userData.lastName;
    return userRepository().save(user);
  }

  static async delete(id: number): Promise<boolean> {
    const user = await userRepository().findOneBy({ id });
    if (!user) {
      return false;
    }
    return !!(await userRepository().remove(user));
  }

  static async fetchUsers(): Promise<User[]> {
    return userRepository().find();
  }

  static async fetchUserById(id: unknown): Promise<User | undefined> {
    const parsedId = parseId(id);
    if (parsedId === null) {
      return undefined;
    }
    return (await userRepository().findOneBy({ id: parsedId })) ?? undefined;
  }

  static async fetchUserByEmail(email: string): Promise<User | undefined> {
    return (await userRepository().findOneBy({ email })) ?? undefined;
  }
}

export default User;
