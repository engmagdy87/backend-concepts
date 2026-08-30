import { DataSource } from "typeorm";
import Product from "../models/product.model";
import Cart from "../models/cart.model";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "3306", 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Product, Cart],
  synchronize: false,
  logging: true,
});

export default AppDataSource;
