import { Request, Response } from 'express';
import Room from '../models/Room';
import RoomMember from '../models/RoomMember';
import { createWxaCodeUnlimit, validateScene } from '../utils/wechat';
import { toFullUrl } from '../utils/url';

/**
 * 生成房间邀请用小程序码
 *
 * 支持两种调用方式：
 * 1) 直接传 scene：/api/wechat/wxacode?scene=r1_iABCDEF
 * 2) 传 roomId 与 invite：/api/wechat/wxacode?roomId=1&invite=ABCDEF
 *
 * 要求：调用者必须登录且是房间成员
 */
export async function getRoomWxaCode(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ code: 401, message: '未登录或登录已过期' });
      return;
    }

    const { scene: sceneQuery, roomId: roomIdQuery, invite } = req.query as Record<string, string | undefined>;

    let scene = (sceneQuery || '').trim();
    let roomId: number | null = null;

    if (!scene) {
      // 通过 roomId + invite 组装 scene
      if (!roomIdQuery || !invite) {
        res.status(400).json({ code: 400, message: '缺少参数：scene 或 (roomId, invite)' });
        return;
      }
      roomId = Number(roomIdQuery);
      if (!Number.isFinite(roomId) || roomId <= 0) {
        res.status(400).json({ code: 400, message: 'roomId 参数不合法' });
        return;
      }
      scene = `r${roomId}_i${String(invite).toUpperCase()}`;
    } else {
      // 从 scene 中尽力解析 roomId（可选，用于权限校验）
      const match = scene.match(/^r(\d+)_i([A-Za-z0-9_\-]+)$/);
      if (match) {
        roomId = Number(match[1]);
      }
    }

    if (!validateScene(scene)) {
      res.status(400).json({ code: 400, message: 'scene 参数不合法' });
      return;
    }

    // 权限校验：必须是房间成员
    if (roomId) {
      const room = await Room.findByPk(roomId);
      if (!room) {
        res.status(404).json({ code: 404, message: '房间不存在' });
        return;
      }
      const membership = await RoomMember.findOne({ where: { room_id: room.id, user_id: userId } });
      if (!membership) {
        res.status(403).json({ code: 403, message: '无权限：仅房间成员可生成小程序码' });
        return;
      }
    }

    // 生成或复用小程序码
    const page = 'pages/entry/index';
    const url = await createWxaCodeUnlimit({ scene, page, width: 430 });
    const fullUrl = toFullUrl(url, req);

    res.json({ code: 200, message: 'ok', data: { url: fullUrl, scene } });
  } catch (error: any) {
    res.status(500).json({ code: 500, message: error?.message || '生成小程序码失败' });
  }
}


