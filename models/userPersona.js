import { DataTypes } from "sequelize";
import db from "../config/db.js";

export const userPersona = db.define(
  "user_personas",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    persona: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "user_personas",
    timestamps: true,
  }
);
