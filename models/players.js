module.exports = (sequelize, DataTypes) => {
  const players = sequelize.define(
    "players",
    {
      address: {
        primaryKey: true,
        unique: true,
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING(80),
        allowNull: true,
        defaultValue: null,
      },
      balance: {
        type: DataTypes.DOUBLE,
        allowNull: true,
        defaultValue: 0,
      },
    },
    {
      tableName: "players",
      freezeTableName: true,
      timestamps: false,
    }
  );

  return players;
};
