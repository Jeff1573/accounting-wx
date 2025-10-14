/**
 * 认证控制器
 * 
 * 处理用户登录相关的业务逻辑
 */

import { Request, Response } from 'express';
import { User } from '../models';
import { getWxOpenId } from '../utils/wechat';
import { generateToken } from '../utils/jwt';
import { toFullUrl } from '../utils/url';

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
      res.status(400).json({
        code: 400,
        message: '缺少登录凭证'
      });
      return;
    }

    // 调用微信 API 获取 openid
    const wxResult = await getWxOpenId(code);
    
    if (!wxResult) {
      res.status(400).json({
        code: 400,
        message: '微信登录失败'
      });
      return;
    }

    const { openid } = wxResult;

    // 查找用户
    let user = await User.findOne({ where: { wx_openid: openid } });
    
    // 判断是否为手动登录（提供了 nickname 或 avatar）
    const isManualLogin = !!(nickname || avatar);

    if (!user) {
      // 用户不存在
      if (isManualLogin) {
        // 手动登录：创建新用户
        user = await User.create({
          wx_openid: openid,
          wx_nickname: nickname || '微信用户',
          wx_avatar: avatar || '',
          status: 'active'
        });
      } else {
        // 静默登录：返回 404，不创建用户
        res.status(404).json({
          code: 404,
          message: '用户不存在，请先完成注册'
        });
        return;
      }
    } else {
      // 用户存在，检查状态
      if (user.status === 'deleted') {
        // 已注销用户
        if (isManualLogin) {
          // 手动登录：恢复账号并更新信息
          await user.update({
            status: 'active',
            wx_nickname: nickname || user.wx_nickname,
            wx_avatar: avatar || user.wx_avatar
          });
        } else {
          // 静默登录：返回 403，禁止登录
          res.status(403).json({
            code: 403,
            message: '账号已注销'
          });
          return;
        }
      } else if (user.status === 'banned') {
        // 已封禁用户：无论手动还是静默都禁止登录
        res.status(403).json({
          code: 403,
          message: '账号已被封禁'
        });
        return;
      } else if (isManualLogin) {
        // 正常用户，手动登录时更新信息
        await user.update({
          wx_nickname: nickname || user.wx_nickname,
          wx_avatar: avatar || user.wx_avatar
        });
      }
      // 正常用户静默登录：不做任何操作，直接继续生成 token
    }

    // 生成 JWT token
    const token = generateToken({
      userId: user.id,
      openid: user.wx_openid
    });

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        userInfo: {
          id: user.id,
          nickname: user.wx_nickname,
          avatar: toFullUrl(user.wx_avatar, req)  // 转换为完整 URL
        },
        expiresIn: 604800  // 7 天，单位秒
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
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
      res.status(401).json({
        code: 401,
        message: '未认证'
      });
      return;
    }

    const user = await User.findByPk(req.user.userId);

    if (!user) {
      res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({
        code: 403,
        message: '账号不可用'
      });
      return;
    }

    res.json({
      code: 200,
      message: '查询成功',
      data: {
        id: user.id,
        nickname: user.wx_nickname,
        avatar: toFullUrl(user.wx_avatar, req)  // 转换为完整 URL
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
}

/**
 * 注销当前账号：将用户状态置为 deleted
 */
export async function deactivate(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        code: 401,
        message: '未认证'
      });
      return;
    }

    const user = await User.findByPk(req.user.userId);
    if (!user) {
      res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
      return;
    }

    await user.update({ status: 'deleted' });

    res.json({
      code: 200,
      message: '账号已注销'
    });
  } catch (error) {
    console.error('注销账号错误:', error);
    res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
}

