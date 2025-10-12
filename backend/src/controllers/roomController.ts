/**
 * 房间控制器
 * 
 * 处理房间管理相关的业务逻辑
 */

import { Request, Response } from 'express';
import { Room, RoomMember, User, Transaction } from '../models';
import { generateInviteCode } from '../utils/inviteCode';
import { Op } from 'sequelize';
import sequelize from '../config/database';

/**
 * 创建房间
 * 
 * @param req - Express 请求对象
 * @param req.body.name - 房间名称
 * @param res - Express 响应对象
 */
export async function createRoom(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const { name } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: '房间名称不能为空' });
      return;
    }

    // 生成唯一邀请码
    let inviteCode = generateInviteCode();
    let existingRoom = await Room.findOne({ where: { invite_code: inviteCode } });
    
    // 如果邀请码已存在，重新生成
    while (existingRoom) {
      inviteCode = generateInviteCode();
      existingRoom = await Room.findOne({ where: { invite_code: inviteCode } });
    }

    // 创建房间
    const room = await Room.create({
      name: name.trim(),
      creator_id: req.user.userId,
      invite_code: inviteCode
    });

    // 创建者自动加入房间
    await RoomMember.create({
      room_id: room.id,
      user_id: req.user.userId
    });

    res.status(201).json({
      id: room.id,
      name: room.name,
      invite_code: room.invite_code,
      created_at: room.created_at
    });
  } catch (error) {
    console.error('创建房间错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
}

/**
 * 加入房间
 * 
 * @param req - Express 请求对象
 * @param req.body.invite_code - 邀请码
 * @param res - Express 响应对象
 */
export async function joinRoom(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const { invite_code } = req.body;

    if (!invite_code) {
      res.status(400).json({ error: '邀请码不能为空' });
      return;
    }

    // 查找房间
    const room = await Room.findOne({ where: { invite_code } });

    if (!room) {
      res.status(404).json({ error: '房间不存在' });
      return;
    }

    // 检查是否已加入
    const existingMember = await RoomMember.findOne({
      where: {
        room_id: room.id,
        user_id: req.user.userId
      }
    });

    if (existingMember) {
      res.status(400).json({ error: '已经是房间成员' });
      return;
    }

    // 加入房间
    await RoomMember.create({
      room_id: room.id,
      user_id: req.user.userId
    });

    // 获取房间成员列表
    const members = await RoomMember.findAll({
      where: { room_id: room.id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'wx_nickname', 'wx_avatar']
        }
      ]
    });

    res.json({
      room: {
        id: room.id,
        name: room.name,
        invite_code: room.invite_code
      },
      members: members.map(m => ({
        id: m.id,
        user_id: m.user_id,
        nickname: m.custom_nickname || (m as any).user.wx_nickname,
        avatar: (m as any).user.wx_avatar,
        joined_at: m.joined_at
      }))
    });
  } catch (error) {
    console.error('加入房间错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
}

/**
 * 获取用户的房间列表
 * 
 * @param req - Express 请求对象
 * @param res - Express 响应对象
 */
export async function getRooms(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const memberships = await RoomMember.findAll({
      where: { user_id: req.user.userId },
      include: [
        {
          model: Room,
          as: 'room'
        }
      ],
      order: [['joined_at', 'DESC']]
    });

    const rooms = await Promise.all(
      memberships.map(async (membership) => {
        const room = (membership as any).room;
        
        // 获取房间成员数
        const memberCount = await RoomMember.count({
          where: { room_id: room.id }
        });

        return {
          id: room.id,
          name: room.name,
          invite_code: room.invite_code,
          member_count: memberCount,
          joined_at: membership.joined_at
        };
      })
    );

    res.json({ rooms });
  } catch (error) {
    console.error('获取房间列表错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
}

/**
 * 获取房间详情
 * 
 * @param req - Express 请求对象
 * @param req.params.roomId - 房间ID
 * @param res - Express 响应对象
 */
export async function getRoomDetail(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const { roomId } = req.params;

    // 查找房间
    const room = await Room.findByPk(roomId);

    if (!room) {
      res.status(404).json({ error: '房间不存在' });
      return;
    }

    // 验证是否是房间成员
    const membership = await RoomMember.findOne({
      where: {
        room_id: room.id,
        user_id: req.user.userId
      }
    });

    if (!membership) {
      res.status(403).json({ error: '无权访问此房间' });
      return;
    }

    // 获取所有成员及其余额
    const members = await RoomMember.findAll({
      where: { room_id: room.id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'wx_nickname', 'wx_avatar']
        }
      ]
    });

    // 计算每个成员的余额
    const balances = await Promise.all(
      members.map(async (member) => {
        // 收到的金额
        const received = await Transaction.sum('amount', {
          where: {
            room_id: room.id,
            payee_id: member.user_id
          }
        }) || 0;

        // 支付的金额
        const paid = await Transaction.sum('amount', {
          where: {
            room_id: room.id,
            payer_id: member.user_id
          }
        }) || 0;

        const balance = Number(received) - Number(paid);

        return {
          id: member.id,
          user_id: member.user_id,
          display_name: member.custom_nickname || (member as any).user.wx_nickname,
          avatar: (member as any).user.wx_avatar,
          balance: balance.toFixed(2),
          joined_at: member.joined_at
        };
      })
    );

    res.json({
      room: {
        id: room.id,
        name: room.name,
        invite_code: room.invite_code,
        created_at: room.created_at
      },
      members: balances
    });
  } catch (error) {
    console.error('获取房间详情错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
}

/**
 * 更新成员昵称
 * 
 * @param req - Express 请求对象
 * @param req.params.roomId - 房间ID
 * @param req.params.memberId - 成员ID
 * @param req.body.custom_nickname - 自定义昵称
 * @param res - Express 响应对象
 */
export async function updateMemberNickname(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const { roomId, memberId } = req.params;
    const { custom_nickname } = req.body;

    // 查找成员记录
    const member = await RoomMember.findOne({
      where: {
        id: memberId,
        room_id: roomId,
        user_id: req.user.userId // 只能修改自己的昵称
      }
    });

    if (!member) {
      res.status(404).json({ error: '成员记录不存在或无权修改' });
      return;
    }

    // 更新昵称
    await member.update({
      custom_nickname: custom_nickname ? custom_nickname.trim() : null
    });

    res.json({
      id: member.id,
      custom_nickname: member.custom_nickname
    });
  } catch (error) {
    console.error('更新成员昵称错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
}

