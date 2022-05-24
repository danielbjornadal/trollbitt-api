import * as Sequelize from "sequelize"
import { sequelize } from "../instances/database"

export interface leaderlogs {
    "id": number
    "no": number
    "slot": number
    "slotInEpoch": number
    "at": string
}

const log = console.log;

export const Leaderlogs = sequelize.define("leaderlogs", {
    "id": { 
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    "no": { 
        type: Sequelize.INTEGER,
        allowNull: false
    },
    "slot": { 
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true
    },
    "slotInEpoch": { 
        type: Sequelize.INTEGER,
        allowNull: false
    },
    "at": { 
        type: Sequelize.DATE,
        allowNull: false
    }
},{
    //initialAutoIncrement: 0,
    paranoid: false,
    timestamps: true,
    freezeTableName: true,
    underscored: false
});

export const Sync = sequelize.sync({force: false})
    .catch(e => {
        log(e);
    })


export const Tables = sequelize.getTables = (next) => {
    sequelize.getQueryInterface().describeTable("leaderlogs").then((tables) => { next(tables) })
}

export const Op = Sequelize.Op;
