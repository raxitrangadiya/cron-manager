'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop table if exists to ensure clean enum/type migration
    await queryInterface.dropTable('schedule_patterns', { cascade: true }).catch(() => {});
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_schedule_patterns_scheduleType";').catch(() => {});

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
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'DAILY'
      },
      repeatEvery: {
        type: Sequelize.INTEGER,
        defaultValue: 1
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
      skipWeekends: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      activeHoursStart: {
        type: Sequelize.STRING,
        allowNull: true
      },
      activeHoursEnd: {
        type: Sequelize.STRING,
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

    // Seed comprehensive system presets
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
        description: 'Triggers Monday through Friday at 9:00 AM (skips weekends)',
        scheduleType: 'WEEKLY',
        timeOfDay: '09:00',
        skipWeekends: true,
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
        scheduleType: 'MONTHLY_DATE',
        timeOfDay: '00:00',
        dayOfMonth: 1,
        cronExpression: '0 0 1 * *',
        isPreset: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '10000000-0000-0000-0000-000000000005',
        name: 'Semi-Annual Financial Review (Jan & Jul 1st)',
        description: 'Triggers twice a year on January 1st and July 1st at 9:00 AM',
        scheduleType: 'SEMI_ANNUALLY',
        timeOfDay: '09:00',
        dayOfMonth: 1,
        cronExpression: '0 9 1 1,7 *',
        isPreset: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '10000000-0000-0000-0000-000000000006',
        name: 'Annual Tax Compliance (March 31st)',
        description: 'Triggers once a year on March 31st at 9:00 AM',
        scheduleType: 'YEARLY_DATE',
        timeOfDay: '09:00',
        dayOfMonth: 31,
        cronExpression: '0 9 31 3 *',
        isPreset: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '10000000-0000-0000-0000-000000000007',
        name: 'Yearly Kickoff (First Monday of January)',
        description: 'Triggers every year on the first Monday of January at 9:00 AM',
        scheduleType: 'YEARLY_RELATIVE',
        timeOfDay: '09:00',
        cronExpression: '0 9 1-7 1 1',
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
