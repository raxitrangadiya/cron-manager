'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cron_job_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      jobId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'cron_jobs',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('SUCCESS', 'FAILED', 'RUNNING'),
        allowNull: false,
        defaultValue: 'RUNNING'
      },
      executionTimeMs: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      result: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      errorDetails: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      runAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
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
    await queryInterface.dropTable('cron_job_logs');
  }
};
