// const { DataTypes } = require('sequelize');
// const sequelize = require('../config/database').sequelize;

// const TokenBlacklist = sequelize.define(
//   'TokenBlacklist', 
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       primaryKey: true,
//       autoIncrement: true,
//     },
//     token: {
//       type: DataTypes.TEXT,
//       allowNull: false,
//       unique: true,
//       validate: {
//         len: [0, 255]  // Hoặc độ dài phù hợp
//       }
//     },
//   },

//   {
//     sequelize,
//     modelName: 'TokenBlacklist',
//     tableName: 'TokenBlacklists',
//     indexes: [
//       {
//         unique: true,
//         fields: ['token'],
//         length: {
//           token: 255 // Chỉ định độ dài của cột token
//         }
//       },
//     ],
//   }
// );

// module.exports = TokenBlacklist;