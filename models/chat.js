module.exports = (sequelize, DataTypes) => {
  const chat = sequelize.define(
    "chat",
    {
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      message: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
    },
    {
      tableName: "chat",
      freezeTableName: true,
      timestamps: false,
    }
  );

  return chat;
};
