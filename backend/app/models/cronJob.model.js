const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CronJob = sequelize.define('CronJob', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    jobType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    cronExpression: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    timezone: {
      type: DataTypes.STRING,
      defaultValue: 'Asia/Kolkata',
      allowNull: false
    },
    payload: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'PAUSED', 'DISABLED'),
      defaultValue: 'ACTIVE',
      allowNull: false
    },
    lastRunAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    nextRunAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'cron_jobs',
    timestamps: true
  });

  CronJob.associate = (models) => {
    CronJob.hasMany(models.CronJobLog, {
      foreignKey: 'jobId',
      as: 'logs',
      onDelete: 'CASCADE'
    });
  };

  return CronJob;
};
