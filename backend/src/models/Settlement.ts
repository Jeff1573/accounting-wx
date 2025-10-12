/**
 * Settlement 结算模型
 * 
 * 记录一次房间结算快照
 */

import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface SettlementAttributes {
  id: number;
  room_id: number;
  creator_id: number;
  created_at?: Date;
}

interface SettlementCreationAttributes extends Optional<SettlementAttributes, 'id'> {}

class Settlement extends Model<SettlementAttributes, SettlementCreationAttributes> implements SettlementAttributes {
  public id!: number;
  public room_id!: number;
  public creator_id!: number;

  public readonly created_at!: Date;
}

Settlement.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      comment: '结算ID'
    },
    room_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '房间ID'
    },
    creator_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '结算发起人（房主）用户ID'
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '创建时间'
    }
  },
  {
    sequelize,
    tableName: 'settlements',
    underscored: true,
    timestamps: false
  }
);

export default Settlement;


