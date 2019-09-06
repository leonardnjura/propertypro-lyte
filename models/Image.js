module.exports = (sequelize, DataTypes) => {
  const Image = sequelize.define(
    'Image',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      propertyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Properties',
          key: 'id'
        }
      },
      imageCaption: {
        type: DataTypes.STRING,
        allowNull: false
      },
      imageUrl: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      classMethods: {
        associate(models) {
          Image.belongsTo(models.Property, {
            foreignKey: 'propertyId',
            onDelete: 'CASCADE'
          });
        }
      }
    },
    {}
  );
  Image.associate = function(models) {
    // associations can be defined here
  };
  return Image;
};
