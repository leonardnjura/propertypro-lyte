module.exports = (sequelize, DataTypes) => {
  const Property = sequelize.define(
    'Property',
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      owner: {
        type: DataTypes.INTEGER
      },
      status: {
        type: DataTypes.STRING
      },
      price: {
        type: DataTypes.FLOAT
      },
      state: {
        type: DataTypes.STRING
      },
      city: {
        type: DataTypes.STRING
      },
      address: {
        type: DataTypes.STRING
      },
      type: {
        type: DataTypes.STRING
      },
      imageUrl: {
        type: DataTypes.STRING
      }
    },
    {
      classMethods: {
        associate(models) {
          Property.hasMany(models.Images, {
            foreignKey: 'propertyId',
            onDelete: 'CASCADE',
            as: 'duck'
          });
          Property.hasMany(models.Flags, {
            foreignKey: 'propertyId',
            onDelete: 'CASCADE',
            as: 'goose'
          });
          Property.belongsTo(models.User, {
            foreignKey: 'owner',
            onDelete: 'CASCADE'
          });
        }
      }
    },
    {}
  );
  Property.associate = function(models) {
    // associations can be defined here
  };
  return Property;
};
