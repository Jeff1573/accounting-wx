/**
 * User 用户模型
 * 
 * 存储微信用户的基本信息
 */

import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

/**
 * 用户状态类型
 */
export type UserStatus = 'active' | 'deleted' | 'banned';

/**
 * 用户属性接口
 */
interface UserAttributes {
  id: number;
  wx_openid: string;
  wx_nickname: string;
  wx_avatar: string;
  status: UserStatus;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * 用户创建属性接口（id 自动生成）
 */
interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

/**
 * User 模型类
 */
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public wx_openid!: string;
  public wx_nickname!: string;
  public wx_avatar!: string;
  public status!: UserStatus;
  
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      comment: '用户ID'
    },
    wx_openid: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '微信OpenID'
    },
    wx_nickname: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '微信昵称'
    },
    wx_avatar: {
      type: DataTypes.STRING(500),
      allowNull: false,
      defaultValue: '',
      comment: '微信头像URL'
    },
    status: {
      type: DataTypes.ENUM('active', 'deleted', 'banned'),
      allowNull: false,
      defaultValue: 'active',
      comment: '用户状态：active-正常，deleted-已注销，banned-已封禁'
    }
  },
  {
    sequelize,
    tableName: 'users',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default User;

