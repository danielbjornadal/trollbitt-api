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
    "time": { 
        type: Sequelize.DATE,
        allowNull: false,
        unique: true
    },
    "height": { 
        type: Sequelize.INTEGER,
        unique: true
    },
    "hash": { 
        type: Sequelize.TEXT,
        unique: true
    },    
    "slot": { 
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true
    },
    "epoch": { 
        type: Sequelize.INTEGER,
        allowNull: false
    },
    "epoch_slot": { 
        type: Sequelize.INTEGER,
        allowNull: false
    },
    "epoch_slot_ideal": { 
        type: Sequelize.FLOAT
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
