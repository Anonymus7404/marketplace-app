'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Provider extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Provider.init({
    user_id: DataTypes.INTEGER,
    business_name: DataTypes.STRING,
    categories: DataTypes.JSONB,
    rating: DataTypes.DECIMAL,
    documents: DataTypes.JSONB,
    is_approved: DataTypes.BOOLEAN,
    approval_status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Provider',
  });
  return Provider;
};