'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Listing extends Model {
    static associate(models) {
      Listing.belongsTo(models.Provider, {
        foreignKey: 'provider_id',
        as: 'Provider'
      });
      
      Listing.belongsTo(models.Category, {
        foreignKey: 'category_id',
        as: 'Category'
      });
      
      Listing.hasMany(models.Booking, {
        foreignKey: 'listing_id',
        as: 'bookings'
      });
    }
  }
  
  Listing.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    provider_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    location: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    price_model: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    photos: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    policies: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    deposit_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Listing',
    tableName: 'Listings',
    paranoid: false // Remove paranoid for now
  });
  
  return Listing;
};