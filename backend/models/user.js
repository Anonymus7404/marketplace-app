'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // A user can be a provider
      User.hasOne(models.Provider, {
        foreignKey: 'user_id',
        as: 'provider_profile'
      });
      
      // A user can have many bookings
      User.hasMany(models.Booking, {
        foreignKey: 'customer_id',
        as: 'bookings'
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
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true,
      validate: {
        is: /^\+?[\d\s-()]+$/,
        len: [10, 15]
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      validate: {
        isEmail: true
      }
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
    paranoid: true,
    hooks: {
      beforeCreate: (user) => {
        if (user.email) {
          user.email = user.email.toLowerCase();
        }
      }
    }
  });
  
  return User;
};