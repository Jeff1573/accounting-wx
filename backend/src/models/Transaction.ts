/**
 * Transaction 交易记录模型
 * 
 * 存储房间内的转账记录
 */

import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

/**
 * 交易记录属性接口
 */
interface TransactionAttributes {
  id: number;
  room_id: number;
  payer_id: number;
  payee_id: number;
  amount: number;
  created_at?: Date;
}

/**
 * 交易记录创建属性接口
 */
interface TransactionCreationAttributes extends Optional<TransactionAttributes, 'id'> {}

/**
 * Transaction 模型类
 */
class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> implements TransactionAttributes {
  public id!: number;
  public room_id!: number;
  public payer_id!: number;
  public payee_id!: number;
  public amount!: number;
  
  public readonly created_at!: Date;
}

Transaction.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      comment: '交易记录ID'
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
    payer_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '付款人用户ID',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    payee_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '收款人用户ID',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: '金额'
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
    tableName: 'transactions',
    underscored: true,
    timestamps: false
  }
);

export default Transaction;

