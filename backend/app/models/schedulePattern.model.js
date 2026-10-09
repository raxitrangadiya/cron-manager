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
      type: DataTypes.ENUM('INTERVAL', 'DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM'),
      allowNull: false,
      defaultValue: 'DAILY'
    },
    repeatIntervalMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    timeOfDay: {
      type: DataTypes.STRING, // HH:mm (e.g. 09:00)
      allowNull: true
    },
    daysOfWeek: {
      type: DataTypes.JSONB, // Array of 0-6 (Sunday to Saturday)
      allowNull: true
    },
    dayOfMonth: {
      type: DataTypes.INTEGER, // 1-31
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
