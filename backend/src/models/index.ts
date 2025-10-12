/**
 * 模型关联配置模块
 * 
 * 定义所有模型之间的关联关系
 */

import User from './User';
import Room from './Room';
import RoomMember from './RoomMember';
import Transaction from './Transaction';

/**
 * 配置模型之间的关联关系
 */
export function setupAssociations(): void {
  // User 与 Room 的关联（创建者）
  User.hasMany(Room, {
    foreignKey: 'creator_id',
    as: 'createdRooms'
  });
  
  Room.belongsTo(User, {
    foreignKey: 'creator_id',
    as: 'creator'
  });

  // User 与 RoomMember 的关联
  User.hasMany(RoomMember, {
    foreignKey: 'user_id',
    as: 'memberships'
  });
  
  RoomMember.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });

  // Room 与 RoomMember 的关联
  Room.hasMany(RoomMember, {
    foreignKey: 'room_id',
    as: 'members'
  });
  
  RoomMember.belongsTo(Room, {
    foreignKey: 'room_id',
    as: 'room'
  });

  // Room 与 Transaction 的关联
  Room.hasMany(Transaction, {
    foreignKey: 'room_id',
    as: 'transactions'
  });
  
  Transaction.belongsTo(Room, {
    foreignKey: 'room_id',
    as: 'room'
  });

  // User 与 Transaction 的关联（付款人）
  User.hasMany(Transaction, {
    foreignKey: 'payer_id',
    as: 'paidTransactions'
  });
  
  Transaction.belongsTo(User, {
    foreignKey: 'payer_id',
    as: 'payer'
  });

  // User 与 Transaction 的关联（收款人）
  User.hasMany(Transaction, {
    foreignKey: 'payee_id',
    as: 'receivedTransactions'
  });
  
  Transaction.belongsTo(User, {
    foreignKey: 'payee_id',
    as: 'payee'
  });
}

export {
  User,
  Room,
  RoomMember,
  Transaction
};

