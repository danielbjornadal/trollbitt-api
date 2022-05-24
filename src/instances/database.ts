const { Sequelize } = require('sequelize');

if (!process.env.DATABASE || !process.env.DATABASE_USERNAME || !process.env.DATABASE_PASSWORD) {
  console.log("Missing database variables. DATABASE, DATABASE_USERNAME, DATABASE_PASSWORD")
  process.exit(0)  
}

const dialect = process.env.DATABASE_DIALECT || "mariadb";
const host = process.env.DATABASE_HOST || "database";
const port = process.env.DATABASE_PORT || 3306;
const logging = process.env.DATABASE_LOGGING || false;

const db = process.env.DATABASE || "database";
const username = process.env.DATABASE_USERNAME || "root";
const password = process.env.DATABASE_PASSWORD || "password" ;

export const sequelize = new Sequelize(db, username, password, {
    dialect,
    host,
    port,
    dialectOptions: {

    },
    logging
});
  
sequelize.authenticate()
  .then(() => {
    console.log("Connection to database OK");
  })
  .catch(() => {
    console.log("Connection to database FAILED");
  });  