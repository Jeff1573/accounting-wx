/**
 * 房间控制器
 * 
 * 处理房间管理相关的业务逻辑
 */

import { Request, Response } from 'express';
import { Room, RoomMember, User, Transaction, Settlement, SettlementItem } from '../models';
import { generateInviteCode } from '../utils/inviteCode';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import { toFullUrl } from '../utils/url';

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
      res.status(401).json({
        code: 401,
        message: '未认证'
      });
      return;
    }

    const { name } = req.body || {};

    // 生成唯一邀请码
    let inviteCode = generateInviteCode();
    let existingRoom = await Room.findOne({ where: { invite_code: inviteCode } });
    
    // 如果邀请码已存在，重新生成
    while (existingRoom) {
      inviteCode = generateInviteCode();
      existingRoom = await Room.findOne({ where: { invite_code: inviteCode } });
    }

    // 生成房间名称（未传名称则使用“房间+邀请码”）
    const finalName = name && name.trim() ? name.trim() : `房间${inviteCode}`;

    // 创建房间
    const room = await Room.create({
      name: finalName,
      creator_id: req.user.userId,
      invite_code: inviteCode
    });

    // 创建者自动加入房间
    await RoomMember.create({
      room_id: room.id,
      user_id: req.user.userId
    });

    res.status(201).json({
      code: 201,
      message: '创建成功',
      data: {
        id: room.id,
        name: room.name,
        invite_code: room.invite_code,
        created_at: room.created_at
      }
    });
  } catch (error) {
    console.error('创建房间错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
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
      res.status(401).json({
        code: 401,
        message: '未认证'
      });
      return;
    }

    const { invite_code } = req.body;

    if (!invite_code) {
      res.status(400).json({
        code: 400,
        message: '邀请码不能为空'
      });
      return;
    }

    // 查找房间
    const room = await Room.findOne({ where: { invite_code } });

    if (!room) {
      res.status(404).json({
        code: 404,
        message: '房间不存在'
      });
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
      // 幂等化：已是成员也返回 200，同时返回房间信息与成员列表
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
        code: 200,
        message: '已在房间',
        data: {
          room: {
            id: room.id,
            name: room.name,
            invite_code: room.invite_code
          },
          members: members.map(m => ({
            id: m.id,
            user_id: m.user_id,
            nickname: m.custom_nickname || (m as any).user.wx_nickname,
            avatar: toFullUrl((m as any).user.wx_avatar),
            joined_at: m.joined_at
          })),
          already_member: true
        }
      });
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
      code: 200,
      message: '加入成功',
      data: {
        room: {
          id: room.id,
          name: room.name,
          invite_code: room.invite_code
        },
        members: members.map(m => ({
          id: m.id,
          user_id: m.user_id,
          nickname: m.custom_nickname || (m as any).user.wx_nickname,
          avatar: toFullUrl((m as any).user.wx_avatar),
          joined_at: m.joined_at
        }))
      }
    });
  } catch (error) {
    console.error('加入房间错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
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
      res.status(401).json({
        code: 401,
        message: '未认证'
      });
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

    res.json({
      code: 200,
      message: '查询成功',
      data: { rooms }
    });
  } catch (error) {
    console.error('获取房间列表错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
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
      res.status(401).json({
        code: 401,
        message: '未认证'
      });
      return;
    }

    const { roomId } = req.params;

    // 查找房间
    const room = await Room.findByPk(roomId);

    if (!room) {
      res.status(404).json({
        code: 404,
        message: '房间不存在'
      });
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
      res.status(403).json({
        code: 403,
        message: '无权访问此房间'
      });
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
            payee_id: member.user_id,
            settlement_id: { [Op.is]: null }
          }
        }) || 0;

        // 支付的金额
        const paid = await Transaction.sum('amount', {
          where: {
            room_id: room.id,
            payer_id: member.user_id,
            settlement_id: { [Op.is]: null }
          }
        }) || 0;

        const balance = Number(received) - Number(paid);

        return {
          id: member.id,
          user_id: member.user_id,
          display_name: member.custom_nickname || (member as any).user.wx_nickname,
          avatar: toFullUrl((member as any).user.wx_avatar),
          balance: balance.toFixed(2),
          joined_at: member.joined_at
        };
      })
    );

    res.json({
      code: 200,
      message: '查询成功',
      data: {
        room: {
          id: room.id,
          name: room.name,
          invite_code: room.invite_code,
          created_at: room.created_at,
          creator_id: room.creator_id
        },
        members: balances
      }
    });
  } catch (error) {
    console.error('获取房间详情错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
}

/**
 * 创建结算（房主）
 * 
 * POST /api/rooms/:roomId/settlements
 */
export async function createSettlement(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ code: 401, message: '未认证' });
      return;
    }

    const { roomId } = req.params;
    const userId = req.user.userId;

    const room = await Room.findByPk(roomId);
    if (!room) {
      res.status(404).json({ code: 404, message: '房间不存在' });
      return;
    }

    // 权限：仅房主可结算
    if (room.creator_id !== userId) {
      res.status(403).json({ code: 403, message: '仅房主可结账' });
      return;
    }

    // 查未结算交易
    const unsettled = await Transaction.findAll({
      where: { room_id: room.id, settlement_id: { [Op.is]: null } }
    });

    if (unsettled.length === 0) {
      res.json({ code: 200, message: '无未结交易', data: { items: [] } });
      return;
    }

    // 计算每个成员净额
    const memberIdsSet = new Set<number>();
    unsettled.forEach(t => { memberIdsSet.add(t.payer_id); memberIdsSet.add(t.payee_id); });
    const memberIds = Array.from(memberIdsSet);

    const netMap = new Map<number, number>();
    for (const uid of memberIds) {
      netMap.set(uid, 0);
    }
    for (const t of unsettled) {
      netMap.set(t.payee_id, (netMap.get(t.payee_id) || 0) + Number(t.amount));
      netMap.set(t.payer_id, (netMap.get(t.payer_id) || 0) - Number(t.amount));
    }

    const t = await sequelize.transaction();
    try {
      // 创建结算
      const settlement = await Settlement.create({
        room_id: room.id,
        creator_id: userId
      }, { transaction: t });

      // 写入明细
      const itemsPayload = Array.from(netMap.entries()).map(([uid, amt]) => ({
        settlement_id: settlement.id,
        user_id: uid,
        net_amount: Number(amt.toFixed(2))
      }));
      await SettlementItem.bulkCreate(itemsPayload as any, { transaction: t });

      // 标记交易为已结算
      const ids = unsettled.map(u => u.id);
      await Transaction.update({ settlement_id: settlement.id }, { where: { id: ids }, transaction: t });

      await t.commit();

      // 返回本次结算结果
      // 准备昵称与头像
      const members = await RoomMember.findAll({
        where: { room_id: room.id },
        include: [{ model: User, as: 'user', attributes: ['id', 'wx_nickname', 'wx_avatar'] }]
      });
      const userInfo = new Map<number, { name: string; avatar: string }>();
      members.forEach(m => {
        userInfo.set(m.user_id, {
          name: m.custom_nickname || (m as any).user.wx_nickname,
          avatar: toFullUrl((m as any).user.wx_avatar)
        });
      });

      const items = Array.from(netMap.entries()).map(([uid, amt]) => ({
        user_id: uid,
        display_name: userInfo.get(uid)?.name || '',
        avatar: userInfo.get(uid)?.avatar || '',
        balance: Number(amt).toFixed(2)
      }));

      res.status(201).json({ code: 201, message: '结算完成', data: { items } });
    } catch (err) {
      await t.rollback();
      throw err;
    }
  } catch (error) {
    console.error('创建结算错误:', error);
    res.status(500).json({ code: 500, message: '服务器内部错误' });
  }
}

/**
 * 查询当前用户是否为某房间成员
 * 
 * 支持使用邀请码或房间ID查询（二选一）
 *
 * @param req.query.invite_code - 邀请码（可选）
 * @param req.query.room_id - 房间ID（可选）
 */
export async function checkMembership(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        code: 401,
        message: '未认证'
      });
      return;
    }

    const inviteCodeRaw = (req.query.invite_code as string | undefined) || undefined;
    const roomIdRaw = (req.query.room_id as string | undefined) || undefined;

    if (!inviteCodeRaw && !roomIdRaw) {
      res.status(400).json({
        code: 400,
        message: '缺少参数 invite_code 或 room_id'
      });
      return;
    }

    // 查找房间
    const inviteCode = inviteCodeRaw ? inviteCodeRaw.toUpperCase() : undefined;
    let room: Room | null = null;

    if (inviteCode) {
      room = await Room.findOne({ where: { invite_code: inviteCode } });
    } else if (roomIdRaw) {
      room = await Room.findByPk(roomIdRaw);
    }

    if (!room) {
      res.status(404).json({
        code: 404,
        message: '房间不存在'
      });
      return;
    }

    // 检查成员关系
    const membership = await RoomMember.findOne({
      where: {
        room_id: room.id,
        user_id: req.user.userId
      }
    });

    res.json({
      code: 200,
      message: '查询成功',
      data: {
        is_member: !!membership,
        room: {
          id: room.id,
          name: room.name,
          invite_code: room.invite_code
        }
      }
    });
  } catch (error) {
    console.error('查询成员关系错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
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
      res.status(401).json({
        code: 401,
        message: '未认证'
      });
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
      res.status(404).json({
        code: 404,
        message: '成员记录不存在或无权修改'
      });
      return;
    }

    // 更新昵称
    await member.update({
      custom_nickname: custom_nickname ? custom_nickname.trim() : null
    });

    res.json({
      code: 200,
      message: '更新成功',
      data: {
        id: member.id,
        custom_nickname: member.custom_nickname
      }
    });
  } catch (error) {
    console.error('更新成员昵称错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
}

/**
 * 退出房间 / 解散房间（房主）
 * 
 * DELETE /api/rooms/:roomId/members/me
 */
export async function leaveRoom(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        code: 401,
        message: '未认证'
      });
      return;
    }

    const { roomId } = req.params;
    const userId = req.user.userId;

    // 校验房间存在
    const room = await Room.findByPk(roomId);
    if (!room) {
      res.status(404).json({
        code: 404,
        message: '房间不存在'
      });
      return;
    }

    // 校验成员关系
    const membership = await RoomMember.findOne({
      where: { room_id: room.id, user_id: userId }
    });

    if (!membership) {
      res.status(403).json({
        code: 403,
        message: '您不是该房间成员'
      });
      return;
    }

    // 房主退出 => 解散房间（移除全部成员）
    if (room.creator_id === userId) {
      const t = await sequelize.transaction();
      try {
        await RoomMember.destroy({ where: { room_id: room.id }, transaction: t });
        await t.commit();
        res.json({
          code: 200,
          message: '房间已解散'
        });
        return;
      } catch (e) {
        await t.rollback();
        throw e;
      }
    }

    // 非房主退出：需要余额为 0 才能退出
    const received = (await Transaction.sum('amount', {
      where: { room_id: room.id, payee_id: userId }
    })) || 0;
    const paid = (await Transaction.sum('amount', {
      where: { room_id: room.id, payer_id: userId }
    })) || 0;

    const balance = Number(received) - Number(paid);
    if (Math.abs(balance) > 1e-6) {
      res.status(409).json({
        code: 409,
        message: '存在未结余额，无法退出房间'
      });
      return;
    }

    await RoomMember.destroy({ where: { room_id: room.id, user_id: userId } });

    res.json({
      code: 200,
      message: '退出成功'
    });
  } catch (error) {
    console.error('退出房间错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
}

