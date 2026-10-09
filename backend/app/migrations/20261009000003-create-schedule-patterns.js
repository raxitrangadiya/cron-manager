'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('schedule_patterns', {
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
      description: {
        type: Sequelize.STRING,
        allowNull: true
      },
      scheduleType: {
        type: Sequelize.ENUM('INTERVAL', 'DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM'),
        allowNull: false,
        defaultValue: 'DAILY'
      },
      repeatIntervalMinutes: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      timeOfDay: {
        type: Sequelize.STRING,
        allowNull: true
      },
      daysOfWeek: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      dayOfMonth: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      cronExpression: {
        type: Sequelize.STRING,
        allowNull: false
      },
      isPreset: {
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
      }
    });

    // Seed default presets (Windows Task Scheduler Style Default Masters)
    await queryInterface.bulkInsert('schedule_patterns', [
      {
        id: '10000000-0000-0000-0000-000000000001',
        name: 'Every 5 Minutes Task',
        description: 'Repeats continuously every 5 minutes',
        scheduleType: 'INTERVAL',
        repeatIntervalMinutes: 5,
        cronExpression: '*/5 * * * *',
        isPreset: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '10000000-0000-0000-0000-000000000002',
        name: 'Daily Morning Business Run (9:00 AM)',
        description: 'Triggers every day at 9:00 AM',
        scheduleType: 'DAILY',
        timeOfDay: '09:00',
        cronExpression: '0 9 * * *',
        isPreset: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '10000000-0000-0000-0000-000000000003',
        name: 'Weekday Work Hours (Mon-Fri 9 AM)',
        description: 'Triggers Monday through Friday at 9:00 AM',
        scheduleType: 'WEEKLY',
        timeOfDay: '09:00',
        daysOfWeek: JSON.stringify([1, 2, 3, 4, 5]),
        cronExpression: '0 9 * * 1-5',
        isPreset: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '10000000-0000-0000-0000-000000000004',
        name: 'Monthly Payroll / Audit Run (1st of Month)',
        description: 'Triggers on the 1st of every month at midnight',
        scheduleType: 'MONTHLY',
        timeOfDay: '00:00',
        dayOfMonth: 1,
        cronExpression: '0 0 1 * *',
        isPreset: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('schedule_patterns');
  }
};
