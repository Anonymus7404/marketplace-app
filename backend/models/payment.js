'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Payment.init({
    booking_id: DataTypes.INTEGER,
    amount: DataTypes.DECIMAL,
    gateway_fee: DataTypes.DECIMAL,
    platform_fee: DataTypes.DECIMAL,
    payout_amount: DataTypes.DECIMAL,
    status: DataTypes.STRING,
    razorpay_order_id: DataTypes.STRING,
    razorpay_payment_id: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Payment',
  });
  return Payment;
};