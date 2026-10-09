const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SchedulePattern = sequelize.define('SchedulePattern', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    scheduleType: {
      type: DataTypes.STRING, // ONCE, INTERVAL, DAILY, WEEKLY, MONTHLY_DATE, MONTHLY_RELATIVE, SEMI_ANNUALLY, YEARLY_DATE, YEARLY_RELATIVE, CUSTOM
      allowNull: false,
      defaultValue: 'DAILY'
    },
    repeatEvery: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    repeatIntervalMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    timeOfDay: {
      type: DataTypes.STRING,
      allowNull: true
    },
    daysOfWeek: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    dayOfMonth: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    skipWeekends: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    activeHoursStart: {
      type: DataTypes.STRING,
      allowNull: true
    },
    activeHoursEnd: {
      type: DataTypes.STRING,
      allowNull: true
    },
    cronExpression: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isPreset: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'schedule_patterns',
    timestamps: true
  });

  return SchedulePattern;
};
