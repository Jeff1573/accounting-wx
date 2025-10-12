/**
 * RoomMember 房间成员模型
 * 
 * 存储用户与房间的关联关系及自定义昵称
 */

import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

/**
 * 房间成员属性接口
 */
interface RoomMemberAttributes {
  id: number;
  room_id: number;
  user_id: number;
  custom_nickname: string | null;
  joined_at?: Date;
}

/**
 * 房间成员创建属性接口
 */
interface RoomMemberCreationAttributes extends Optional<RoomMemberAttributes, 'id' | 'custom_nickname'> {}

/**
 * RoomMember 模型类
 */
class RoomMember extends Model<RoomMemberAttributes, RoomMemberCreationAttributes> implements RoomMemberAttributes {
  public id!: number;
  public room_id!: number;
  public user_id!: number;
  public custom_nickname!: string | null;
  
  public readonly joined_at!: Date;
}

RoomMember.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      comment: '成员记录ID'
    },
    room_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '房间ID',
      references: {
        model: 'rooms',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '用户ID',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    custom_nickname: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
      comment: '房间内自定义昵称'
    },
    joined_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '加入时间'
    }
  },
  {
    sequelize,
    tableName: 'room_members',
    underscored: true,
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['room_id', 'user_id']
      }
    ]
  }
);

export default RoomMember;

