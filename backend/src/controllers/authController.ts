/**
 * 认证控制器
 * 
 * 处理用户登录相关的业务逻辑
 */

import { Request, Response } from 'express';
import { User } from '../models';
import { getWxOpenId } from '../utils/wechat';
import { generateToken } from '../utils/jwt';

/**
 * 微信登录
 * 
 * 通过微信登录 code 获取用户信息，如果用户不存在则创建新用户
 * 
 * @param req - Express 请求对象
 * @param req.body.code - 微信登录凭证
 * @param req.body.nickname - 微信昵称
 * @param req.body.avatar - 微信头像 URL
 * @param res - Express 响应对象
 */
export async function wxLogin(req: Request, res: Response): Promise<void> {
  try {
    const { code, nickname, avatar } = req.body;

    if (!code) {
      res.status(400).json({ error: '缺少登录凭证' });
      return;
    }

    // 调用微信 API 获取 openid
    const wxResult = await getWxOpenId(code);
    
    if (!wxResult) {
      res.status(400).json({ error: '微信登录失败' });
      return;
    }

    const { openid } = wxResult;

    // 查找或创建用户
    let user = await User.findOne({ where: { wx_openid: openid } });

    if (!user) {
      // 创建新用户
      user = await User.create({
        wx_openid: openid,
        wx_nickname: nickname || '微信用户',
        wx_avatar: avatar || ''
      });
    } else {
      // 更新用户信息
      if (nickname || avatar) {
        await user.update({
          wx_nickname: nickname || user.wx_nickname,
          wx_avatar: avatar || user.wx_avatar
        });
      }
    }

    // 生成 JWT token
    const token = generateToken({
      userId: user.id,
      openid: user.wx_openid
    });

    res.json({
      token,
      userInfo: {
        id: user.id,
        nickname: user.wx_nickname,
        avatar: user.wx_avatar
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
}

/**
 * 获取当前用户信息
 * 
 * @param req - Express 请求对象（包含 user 信息）
 * @param res - Express 响应对象
 */
export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: '未认证' });
      return;
    }

    const user = await User.findByPk(req.user.userId);

    if (!user) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    res.json({
      id: user.id,
      nickname: user.wx_nickname,
      avatar: user.wx_avatar
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
}

