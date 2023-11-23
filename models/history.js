module.exports = (sequelize, DataTypes) => {
  const history = sequelize.define(
    "history",
    {
      date: {
        primaryKey: true,
        unique: true,
        type: DataTypes.DATE,
        allowNull: false,
      },
      hashedServerSeed: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
      serverSeed: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      nonce: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      crashPoint: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
      },
      maxMultiplier: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      tableName: "history",
      freezeTableName: true,
      timestamps: false,
    }
  );

  return history;
};
