/**
 * Room 房间模型
 * 
 * 存储记账房间的基本信息
 */

import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

/**
 * 房间属性接口
 */
interface RoomAttributes {
  id: number;
  name: string;
  creator_id: number;
  invite_code: string;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * 房间创建属性接口
 */
interface RoomCreationAttributes extends Optional<RoomAttributes, 'id' | 'invite_code'> {}

/**
 * Room 模型类
 */
class Room extends Model<RoomAttributes, RoomCreationAttributes> implements RoomAttributes {
  public id!: number;
  public name!: string;
  public creator_id!: number;
  public invite_code!: string;
  
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Room.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      comment: '房间ID'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '房间名称'
    },
    creator_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '创建者用户ID',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    invite_code: {
      type: DataTypes.STRING(6),
      allowNull: false,
      unique: true,
      comment: '邀请码'
    }
  },
  {
    sequelize,
    tableName: 'rooms',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default Room;

