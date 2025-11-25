'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Listing extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Listing.init({
    provider_id: DataTypes.INTEGER,
    category_id: DataTypes.INTEGER,
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    location: DataTypes.JSONB,
    price_model: DataTypes.JSONB,
    photos: DataTypes.JSONB,
    policies: DataTypes.JSONB,
    deposit_amount: DataTypes.DECIMAL,
    is_active: DataTypes.BOOLEAN,
    is_featured: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Listing',
  });
  return Listing;
};