import { DataTypes } from "sequelize";
import db from "../config/db.js";

export const ModelPersona = db.define("model_personas", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    gender: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    persona: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
}, {
    tableName: "model_personas",
    timestamps: true,
})