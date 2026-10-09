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
      type: DataTypes.STRING, // Supports ONCE, INTERVAL, DAILY, WEEKLY, MONTHLY_DATE, MONTHLY_RELATIVE, SEMI_ANNUALLY, YEARLY_DATE, YEARLY_RELATIVE, CUSTOM
      allowNull: false,
      defaultValue: 'DAILY'
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
