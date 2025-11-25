'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasOne(models.Provider, {
        foreignKey: 'user_id',
        as: 'provider_profile'
      });
      
      User.hasMany(models.Booking, {
        foreignKey: 'customer_id',
        as: 'customer_bookings'
      });
    }
  }
  
  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    user_type: {
      type: DataTypes.ENUM('customer', 'provider', 'admin'),
      defaultValue: 'customer',
      allowNull: false
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    kyc_status: {
      type: DataTypes.ENUM('pending', 'verified', 'rejected', 'not_submitted'),
      defaultValue: 'not_submitted'
    },
    profile_picture: {
      type: DataTypes.STRING,
      allowNull: true
    },
    date_of_birth: {
      type: DataTypes.DATE,
      allowNull: true
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    paranoid: false // Remove paranoid
  });
  
  return User;
};