'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Providers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      business_name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      categories: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      rating: {
        type: Sequelize.DECIMAL(3,2),
        defaultValue: 0.00
      },
      documents: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      is_approved: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      approval_status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    await queryInterface.addIndex('Providers', ['user_id']);
    await queryInterface.addIndex('Providers', ['is_approved']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Providers');
  }
};