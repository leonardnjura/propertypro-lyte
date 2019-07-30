module.exports = (sequelize, DataTypes) => {
  const Flag = sequelize.define(
    'Flag',
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      propertyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Properties',
          key: 'id'
        }
      },
      reason: {
        type: DataTypes.STRING
      },
      description: {
        type: DataTypes.STRING
      }
    },
    {}
  );
  Flag.associate = function(models) {
    // associations can be defined here
  };
  return Flag;
};
