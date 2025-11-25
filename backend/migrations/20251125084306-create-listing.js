'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Listings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      provider_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Providers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      location: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      price_model: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      photos: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      policies: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      deposit_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      is_featured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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

    // Add indexes
    await queryInterface.addIndex('Listings', ['provider_id']);
    await queryInterface.addIndex('Listings', ['category_id']);
    await queryInterface.addIndex('Listings', ['is_active']);
    await queryInterface.addIndex('Listings', ['is_featured']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Listings');
  }
};