const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CronJobLog = sequelize.define('CronJobLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    jobId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'cron_jobs',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    status: {
      type: DataTypes.ENUM('SUCCESS', 'FAILED', 'RUNNING'),
      allowNull: false,
      defaultValue: 'RUNNING'
    },
    executionTimeMs: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    result: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    errorDetails: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    runAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'cron_job_logs',
    timestamps: true
  });

  CronJobLog.associate = (models) => {
    CronJobLog.belongsTo(models.CronJob, {
      foreignKey: 'jobId',
      as: 'job'
    });
  };

  return CronJobLog;
};
