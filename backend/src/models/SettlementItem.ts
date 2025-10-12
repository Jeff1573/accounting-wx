/**
 * SettlementItem 结算明细模型
 */

import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface SettlementItemAttributes {
  id: number;
  settlement_id: number;
  user_id: number;
  net_amount: number; // 收到-支付
  created_at?: Date;
}

interface SettlementItemCreationAttributes extends Optional<SettlementItemAttributes, 'id'> {}

class SettlementItem extends Model<SettlementItemAttributes, SettlementItemCreationAttributes> implements SettlementItemAttributes {
  public id!: number;
  public settlement_id!: number;
  public user_id!: number;
  public net_amount!: number;

  public readonly created_at!: Date;
}

SettlementItem.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      comment: '结算明细ID'
    },
    settlement_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '结算ID'
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '用户ID'
    },
    net_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: '净额（收-支）'
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
    tableName: 'settlement_items',
    underscored: true,
    timestamps: false
  }
);

export default SettlementItem;


