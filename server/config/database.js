const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgresql://localhost:5432/smart_planner',
  {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'production' ? false : console.log,
    define: {
      timestamps: true,
      underscored: true,
    },
  }
);

module.exports = sequelize;
