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
    {}
  );
  Image.associate = function(models) {
    // associations can be defined here
  };
  return Image;
};
