module.exports = (sequelize, DataTypes) => {
  const bets = sequelize.define(
    "bets",
    {
      roundDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      address: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      bet: {
        type: DataTypes.DOUBLE,
        allowNull: false,
      },
      exitMultiplier: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
      },
      prize: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      tableName: "bets",
      freezeTableName: true,
      timestamps: false,
    }
  );

  return bets;
};
