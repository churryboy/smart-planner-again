const sequelize = require('../config/database');
const User = require('./User');
const Event = require('./Event');
const Todo = require('./Todo');

// Define associations
User.hasMany(Event, { foreignKey: 'user_id', as: 'events' });
Event.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Todo, { foreignKey: 'user_id', as: 'todos' });
Todo.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Sync database
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    await sequelize.sync({ force: false });
    console.log('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
};

module.exports = {
  sequelize,
  User,
  Event,
  Todo,
  syncDatabase,
};
