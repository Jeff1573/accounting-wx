/**
 * 交易记录控制器
 * 
 * 处理房间内交易记录相关的业务逻辑
 */

import { Request, Response } from 'express';
import { Transaction, Room, RoomMember, User } from '../models';
import { Op } from 'sequelize';
import { toFullUrl } from '../utils/url';

/**
 * 创建交易记录
 * 
 * @param req - Express 请求对象
 * @param req.params.roomId - 房间ID
 * @param req.body.payee_id - 收款人用户ID
 * @param req.body.amount - 金额
 * @param res - Express 响应对象
 */
export async function createTransaction(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        code: 401,
        message: '未认证'
      });
      return;
    }

    const { roomId } = req.params;
    const { payee_id, amount } = req.body;

    // 验证输入
    if (!payee_id || !amount) {
      res.status(400).json({
        code: 400,
        message: '缺少必要参数'
      });
      return;
    }

    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      res.status(400).json({
        code: 400,
        message: '金额必须大于0'
      });
      return;
    }

    // 验证房间存在
    const room = await Room.findByPk(roomId);
    if (!room) {
      res.status(404).json({
        code: 404,
        message: '房间不存在'
      });
      return;
    }

    // 验证付款人是房间成员
    const payerMember = await RoomMember.findOne({
      where: {
        room_id: roomId,
        user_id: req.user.userId
      }
    });

    if (!payerMember) {
      res.status(403).json({
        code: 403,
        message: '您不是房间成员'
      });
      return;
    }

    // 验证收款人是房间成员
    const payeeMember = await RoomMember.findOne({
      where: {
        room_id: roomId,
        user_id: payee_id
      }
    });

    if (!payeeMember) {
      res.status(400).json({
        code: 400,
        message: '收款人不是房间成员'
      });
      return;
    }

    // 不能给自己转账
    if (req.user.userId === payee_id) {
      res.status(400).json({
        code: 400,
        message: '不能给自己转账'
      });
      return;
    }

    // 创建交易记录
    const transaction = await Transaction.create({
      room_id: Number(roomId),
      payer_id: req.user.userId,
      payee_id: Number(payee_id),
      amount: amountNum
    });

    // 获取付款人和收款人信息
    const payer = await User.findByPk(req.user.userId);
    const payee = await User.findByPk(payee_id);

    res.status(201).json({
      code: 201,
      message: '创建成功',
      data: {
        id: transaction.id,
        room_id: transaction.room_id,
        payer: {
          id: payer?.id,
          nickname: payerMember.custom_nickname || payer?.wx_nickname
        },
        payee: {
          id: payee?.id,
          nickname: payeeMember.custom_nickname || payee?.wx_nickname
        },
        amount: transaction.amount,
        created_at: transaction.created_at
      }
    });
  } catch (error) {
    console.error('创建交易记录错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
}

/**
 * 获取房间交易记录
 * 
 * @param req - Express 请求对象
 * @param req.params.roomId - 房间ID
 * @param req.query.page - 页码（默认1）
 * @param req.query.limit - 每页条数（默认20）
 * @param res - Express 响应对象
 */
export async function getTransactions(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        code: 401,
        message: '未认证'
      });
      return;
    }

    const { roomId } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // 验证是否是房间成员
    const membership = await RoomMember.findOne({
      where: {
        room_id: roomId,
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

    // 获取交易记录
    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where: { room_id: roomId },
      include: [
        {
          model: User,
          as: 'payer',
          attributes: ['id', 'wx_nickname', 'wx_avatar']
        },
        {
          model: User,
          as: 'payee',
          attributes: ['id', 'wx_nickname', 'wx_avatar']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    // 获取成员的自定义昵称
    const memberMap = new Map<number, string>();
    const members = await RoomMember.findAll({
      where: { room_id: roomId }
    });
    
    members.forEach(m => {
      if (m.custom_nickname) {
        memberMap.set(m.user_id, m.custom_nickname);
      }
    });

    const formattedTransactions = transactions.map(t => ({
      id: t.id,
      payer: {
        id: (t as any).payer.id,
        nickname: memberMap.get((t as any).payer.id) || (t as any).payer.wx_nickname,
        avatar: toFullUrl((t as any).payer.wx_avatar)
      },
      payee: {
        id: (t as any).payee.id,
        nickname: memberMap.get((t as any).payee.id) || (t as any).payee.wx_nickname,
        avatar: toFullUrl((t as any).payee.wx_avatar)
      },
      amount: t.amount,
      created_at: t.created_at
    }));

    res.json({
      code: 200,
      message: '查询成功',
      data: {
        transactions: formattedTransactions,
        pagination: {
          page,
          limit,
          total: count,
          total_pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取交易记录错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
}

/**
 * 获取房间成员余额统计
 * 
 * @param req - Express 请求对象
 * @param req.params.roomId - 房间ID
 * @param res - Express 响应对象
 */
export async function getBalances(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        code: 401,
        message: '未认证'
      });
      return;
    }

    const { roomId } = req.params;

    // 验证是否是房间成员
    const membership = await RoomMember.findOne({
      where: {
        room_id: roomId,
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

    // 获取所有成员
    const members = await RoomMember.findAll({
      where: { room_id: roomId },
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
            room_id: roomId,
            payee_id: member.user_id
          }
        }) || 0;

        // 支付的金额
        const paid = await Transaction.sum('amount', {
          where: {
            room_id: roomId,
            payer_id: member.user_id
          }
        }) || 0;

        const balance = Number(received) - Number(paid);

        return {
          user_id: member.user_id,
          display_name: member.custom_nickname || (member as any).user.wx_nickname,
          avatar: (member as any).user.wx_avatar,
          balance: balance.toFixed(2)
        };
      })
    );

    res.json({
      code: 200,
      message: '查询成功',
      data: { balances }
    });
  } catch (error) {
    console.error('获取余额统计错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
}

