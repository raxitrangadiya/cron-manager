'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cron_jobs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      jobType: {
        type: Sequelize.STRING,
        allowNull: false
      },
      cronExpression: {
        type: Sequelize.STRING,
        allowNull: false
      },
      timezone: {
        type: Sequelize.STRING,
        defaultValue: 'Asia/Kolkata',
        allowNull: false
      },
      payload: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'PAUSED', 'DISABLED'),
        defaultValue: 'ACTIVE',
        allowNull: false
      },
      lastRunAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      nextRunAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('cron_jobs');
  }
};
