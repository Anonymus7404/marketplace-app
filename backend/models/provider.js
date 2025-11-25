'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Provider extends Model {
    static associate(models) {
      Provider.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'User'
      });
      
      Provider.hasMany(models.Listing, {
        foreignKey: 'provider_id',
        as: 'listings'
      });
      
      Provider.hasMany(models.Booking, {
        foreignKey: 'provider_id',
        as: 'bookings'
      });
    }
  }
  
  Provider.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    business_name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    categories: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    rating: {
      type: DataTypes.DECIMAL(3,2),
      defaultValue: 0.00
    },
    documents: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    is_approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    approval_status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    }
  }, {
    sequelize,
    modelName: 'Provider',
    tableName: 'Providers',
    paranoid: false // Remove paranoid
  });
  
  return Provider;
};