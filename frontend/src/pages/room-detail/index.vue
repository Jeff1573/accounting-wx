<template>
  <view class="room-detail-container">
    <!-- WebSocket 连接状态提示 -->
    <view v-if="showWsStatus" :class="['ws-status-bar', `ws-status-bar--${wsState}`]">
      <text class="ws-status-text">
        {{ wsState === 'connecting' ? '连接中...' : wsState === 'connected' ? '已连接' : '连接失败' }}
      </text>
    </view>
    
    <!-- 房间头部信息 -->
    <view class="room-header card">
      <view class="room-info">
        <text class="room-name">{{ room?.name }}</text>
        <view class="invite-row">
          <text class="invite-label">邀请码:</text>
          <text class="invite-code" @tap="copyInviteCode">{{ room?.invite_code }}</text>
          <button class="share-btn" size="mini" @tap="copyInviteMessage">复制邀请</button>
          <button class="share-btn share-btn--secondary" size="mini" @tap="generatePoster">生成海报</button>
        </view>
      </view>
    </view>

    <!-- 成员列表 -->
    <view class="members-section">
      <view class="section-title">成员余额</view>
      <scroll-view class="members-scroll" scroll-x="true">
        <view class="members-row">
          <view v-for="member in sortedMembers" :key="member.id" class="member-card"
            @tap="selectMemberForTransaction(member)">
            <text v-if="room?.creator_id === member.user_id" class="owner-badge" aria-label="房主">👑</text>
            <image class="member-avatar" :src="member.avatar" mode="aspectFill"></image>
            <view class="member-name-row">
              <text class="member-name">{{ member.display_name }}</text>
            </view>
            <view class="member-balance-row">
              <text :class="['member-balance', getBalanceClass(member.balance)]">
                {{ formatBalance(member.balance) }}
              </text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 交易记录 -->
    <view class="transactions-section">
      <view class="section-title">交易记录</view>

      <scroll-view class="transactions-scroll" scroll-y="true" @scrolltolower="handleScrollToLower">
        <view v-if="transactions.length === 0 && !isLoadingMore" class="empty-transactions">
          <text class="empty-text">暂无交易记录</text>
        </view>

        <view v-else class="transaction-list">
          <view v-for="transaction in transactions" :key="transaction.id" class="transaction-item">
            <view class="transaction-users">
              <image class="user-avatar" :src="transaction.payer.avatar" mode="aspectFill"></image>
              <text class="user-name">{{ transaction.payer.nickname }}</text>
              <text class="arrow">→</text>
              <image class="user-avatar" :src="transaction.payee.avatar" mode="aspectFill"></image>
              <text class="user-name">{{ transaction.payee.nickname }}</text>
            </view>
            <view class="transaction-info">
              <text class="transaction-amount">¥{{ formatAmount(transaction.amount) }}</text>
              <text class="transaction-time">{{ formatDate(transaction.created_at, 'datetime') }}</text>
            </view>
          </view>

          <!-- 加载更多提示 -->
          <view v-if="isLoadingMore" class="loading-more">
            <text class="loading-text">加载中...</text>
          </view>
          <view v-else-if="!hasMoreData && transactions.length > 0" class="no-more-data">
            <text class="no-more-text">已显示全部交易记录</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 浮动按钮 -->
    <view class="fab" @tap="showMemberSelector">
      <text class="fab-icon">+</text>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-action-bar">
      <button v-if="isOwner" class="bar-btn bar-btn--primary" :disabled="actionLoading" :loading="actionLoading"
        @click="handleSettlement">结账</button>
      <button class="bar-btn bar-btn--danger" :disabled="actionLoading" @click="handleLeaveRoom">退出房间</button>
    </view>

    <!-- 选择成员弹窗 -->
    <view v-if="memberSelectorVisible" class="modal-mask" @tap="hideMemberSelector">
      <view class="member-selector" @tap.stop>
        <view class="selector-title">选择收款人</view>
        <view class="selector-list">
          <view v-for="member in otherMembers" :key="member.id" class="selector-item" @tap="selectPayee(member)">
            <image class="selector-avatar" :src="member.avatar" mode="aspectFill"></image>
            <text class="selector-name">{{ member.display_name }}</text>
          </view>
        </view>
        <button class="selector-cancel" @click="hideMemberSelector">取消</button>
      </view>
    </view>

    <!-- 转账输入弹窗 -->
    <view v-if="transferDialogVisible" class="modal-mask" @tap="closeTransferDialog">
      <view class="transfer-modal" @tap.stop
        :style="{ marginBottom: keyboardHeight > 0 ? (keyboardHeight + 20) + 'rpx' : '' }">
        <view class="transfer-title">向 {{ currentPayee?.display_name }} 转账</view>
        <view class="amount-row">
          <text class="currency">¥</text>
          <input class="amount-input" type="digit" v-model="transferAmount" placeholder="请输入金额"
            @input="handleAmountInput" :focus="transferInputFocus" confirm-type="done" @confirm="submitTransfer"
            cursor-spacing="30" />
        </view>
        <view class="actions">
          <button class="btn cancel" @tap="closeTransferDialog">取消</button>
          <button class="btn confirm" :disabled="!isAmountValid || submitting" :loading="submitting"
            @tap="submitTransfer">确认</button>
        </view>
      </view>
    </view>
  </view>

  <!-- 分享海报 -->
  <SharePoster
    v-if="room"
    :visible="posterVisible"
    :room-name="room?.name || ''"
    :inviter-name="userStore.userInfo?.nickname || '我'"
    :invite-code="room?.invite_code || ''"
    :wxa-code-url="posterWxaUrl"
    @close="posterVisible = false"
  />

  <!-- 结算结果弹窗 -->
  <view v-if="settlementResultVisible" class="modal-mask">
    <view class="settlement-modal" @tap.stop>
      <view class="settlement-title">本次结算结果</view>
      <view class="settlement-list">
        <view class="settlement-item" v-for="item in settlementItems" :key="item.user_id">
          <image class="settlement-avatar" :src="item.avatar" mode="aspectFill" />
          <view class="settlement-name">{{ item.display_name }}</view>
          <view class="settlement-amount" :class="getBalanceClass(item.balance)">{{ formatBalance(item.balance) }}
          </view>
        </view>
      </view>
      <button class="settlement-confirm" :disabled="actionLoading" @click="confirmSettlementResult">确认</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { onLoad, onPullDownRefresh, onHide, onUnload, onShow } from '@dcloudio/uni-app';
import { getRoomWxaCode } from '@/api/wechat';
import SharePoster from '@/components/SharePoster.vue';
import { useUserStore } from '@/stores/user';
import { useRoomStore } from '@/stores/room';
import { getRoomDetail, leaveRoom, closeRoom } from '@/api/room';
import { getTransactions, createSettlement } from '@/api/transaction';
import { createTransaction } from '@/api/transaction';
import type { BalancesResponse } from '@/api/transaction';
import type { Room, RoomMember, Transaction } from '@/stores/room';
import { formatAmount, formatBalance, formatDate, getBalanceClass } from '@/utils/format';
import { connectRoomWS } from '@/utils/realtime';
import { useAuthGuard } from '@/composables/authGuard';
import { useDebounce, useRequestLock } from '@/composables/useDebounce';

const userStore = useUserStore();
const roomStore = useRoomStore();

// 防抖 Hook：防止短时间内重复调用合并函数
const { debounce: debounceTransactionMerge, reset: resetTransactionDebounce } = useDebounce(500);

// 请求锁：确保刷新房间摘要时不会并发执行
const { withLock: withRoomSummaryLock } = useRequestLock();

const roomId = ref<number>(0);
const room = ref<Room | null>(null);
const members = ref<RoomMember[]>([]);
const transactions = ref<Transaction[]>([]);
const memberSelectorVisible = ref(false);
const actionLoading = ref(false);
const settlementResultVisible = ref(false);
const settlementItems = ref<BalancesResponse['balances']>([]);
const isFirstLoad = ref<boolean>(true);

// 分页状态管理
const currentPage = ref<number>(1);
const pageSize = ref<number>(20);
const isLoadingMore = ref<boolean>(false);
const hasMoreData = ref<boolean>(true);
const totalTransactions = ref<number>(0);

// 转账弹窗状态
const transferDialogVisible = ref(false);
const currentPayee = ref<RoomMember | null>(null);
const transferAmount = ref<string>('');
const submitting = ref(false);
const transferInputFocus = ref(false);
const keyboardHeight = ref(0);
// 海报
const posterVisible = ref(false);
const posterWxaUrl = ref('');

// WebSocket 连接状态
const wsState = ref<'connecting' | 'connected' | 'disconnected'>('disconnected');
const showWsStatus = ref(true); // 是否显示连接状态条
let hideStatusTimer: number | null = null;

const isShowBottomActionBar = ref(false);
// 是否为房主
const isOwner = computed(() => !!room.value && room.value.creator_id === userStore.userInfo?.id);

/**
 * 排序后的成员（房主优先）
 */
const sortedMembers = computed(() => {
  if (!room.value) return members.value;
  const creatorId = room.value.creator_id;
  return [...members.value].sort((a, b) => {
    const aOwner = a.user_id === creatorId ? 1 : 0;
    const bOwner = b.user_id === creatorId ? 1 : 0;
    if (aOwner !== bOwner) return bOwner - aOwner; // 房主优先
    return 0;
  });
});

/**
 * 其他成员（排除自己）
 */
const otherMembers = computed(() => {
  return members.value.filter(m => m.user_id !== userStore.userInfo?.id);
});

onLoad(async (options: any) => {
  const ensureAuth = useAuthGuard({ requireLogin: true, validateStatusTTLMs: 5 * 60 * 1000 });
  const ok = await ensureAuth();
  if (!ok) return;
  isFirstLoad.value = true;
  roomId.value = Number(options.roomId);
  // @ts-ignore
  if (import.meta.env.DEV) {
    console.log('[房间详情] onLoad - 房间ID:', options.roomId);
  }

  // 优化：检查是否已有缓存数据（从邀请流程跳转过来时）
  // 缓存策略：从邀请流程加入房间时，数据已存储在 store 中，跳转到房间页后无需重新请求
  // 注意：如果 roomId 发生变化（切换房间），则不使用缓存
  const cachedRoom = roomStore.currentRoom;
  const isCached = cachedRoom && cachedRoom.id === roomId.value && roomStore.members.length > 0;

  if (!isCached) {
    // 无缓存或非当前房间，重新加载（loadRoomDetail 中会清除旧缓存）
    loadRoomDetail();
  } else {
    // 有缓存：直接使用 store 中的数据（避免重复请求 API）
    room.value = cachedRoom;
    members.value = roomStore.members;
    // 仅加载交易记录（从缓存房间进入）
    loadTransactionsFirstPage();
  }

  // 建立实时连接
  setupRealtime();
});

onShow(() => {
  // @ts-ignore
  if (import.meta.env.DEV) {
    console.log('[房间详情] onShow - 检查连接状态:', wsState.value);
  }

  // 页面再次可见时确保已连接
  // 如果连接断开或不存在，重新建立连接
  if (wsState.value === 'disconnected' || !rt) {
    // @ts-ignore
    if (import.meta.env.DEV) {
      console.log('[房间详情] onShow - 重新建立连接');
    }
    setupRealtime();
  }

  // 非首次加载时，轻量刷新房间摘要（确保成员余额最新）
  // 场景：页面在后台期间可能错过了 WebSocket 事件，或 UI 未更新
  if (!isFirstLoad.value) {
    // @ts-ignore
    if (import.meta.env.DEV) {
      console.log('[房间详情] onShow - 刷新房间摘要');
    }
    refreshRoomSummary();
  }
  
  isFirstLoad.value = false;
});

onHide(() => {
  // 页面隐藏时保持连接，不关闭（避免消息丢失）
  // @ts-ignore
  if (import.meta.env.DEV) {
    console.log('[房间详情] onHide - 保持连接');
  }
});

onUnload(() => {
  // 页面销毁时关闭连接
  // @ts-ignore
  if (import.meta.env.DEV) {
    console.log('[房间详情] onUnload - 断开连接');
  }
  teardownRealtime();
  // 重置防抖状态，确保下次进入页面时状态干净
  resetTransactionDebounce();
});

/**
 * 加载房间详情
 */
async function loadRoomDetail() {
  try {
    // 重置分页状态
    currentPage.value = 1;
    hasMoreData.value = true;
    isLoadingMore.value = false;
    transactions.value = [];

    // 优化：移除全屏loading，改为非阻塞式轻量提示
    uni.showLoading({
      title: '加载中...',
      mask: false,        // ✅ 不遮挡页面，允许交互
      duration: 1500      // ✅ 1.5秒后自动消失
    });

    // 加载房间信息和成员
    const roomResult = await getRoomDetail(roomId.value);
    room.value = roomResult.room;
    members.value = roomResult.members;
    roomStore.setCurrentRoom(roomResult.room);
    roomStore.setMembers(roomResult.members);
    try { uni.setStorageSync('lastRoomId', String(roomId.value)); } catch {}

    // 加载交易记录
    const transResult = await getTransactions(roomId.value, currentPage.value, pageSize.value);
    transactions.value = transResult.transactions;
    totalTransactions.value = transResult.pagination.total;
    roomStore.setTransactions(transResult.transactions);

    // 检查是否还有更多数据
    hasMoreData.value = transactions.value.length < totalTransactions.value;

    // 成功后隐藏 loading
    uni.hideLoading();
  } catch (error) {
    uni.hideLoading();
    console.error('加载房间详情失败:', error);
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    });
  }
}

// ========== 分页加载交易记录 ==========

/**
 * 滚动到底部事件处理
 */
function handleScrollToLower() {
  if (!isLoadingMore.value && hasMoreData.value) {
    loadMoreTransactions();
  }
}

/**
 * 增量合并最新交易的核心逻辑（内部函数）
 * 不干扰当前分页状态，仅添加最新记录
 * 
 * 当检测到数据断层（新交易超过1页）时，自动降级为全量重载
 */
async function _mergeLatestTransactionsCore() {
  try {
    // 获取第1页最新数据
    const transResult = await getTransactions(roomId.value, 1, pageSize.value);
    
    // ✅ 断层检测：如果本地最新记录不在服务端第1页中，说明有超过1页的新数据
    if (transactions.value.length > 0 && transResult.transactions.length > 0) {
      const localNewestId = transactions.value[0].id;
      const serverFirstPageIds = new Set(transResult.transactions.map(t => t.id));
      
      if (!serverFirstPageIds.has(localNewestId)) {
        // @ts-ignore
        if (import.meta.env.DEV) {
          console.warn('[增量合并] 检测到数据断层（新交易超过1页），执行全量重载');
        }
        // 降级为全量重载，避免数据丢失
        await reloadAllTransactions();
        return;
      }
    }
    
    // 正常的增量合并流程
    const existingIndexMap = new Map<number, number>();
    transactions.value.forEach((t, index) => {
      existingIndexMap.set(t.id, index);
    });

    const latestNew: Transaction[] = [];
    const merged = [...transactions.value];

    transResult.transactions.forEach(tx => {
      const idx = existingIndexMap.get(tx.id);
      if (idx === undefined) {
        latestNew.push(tx);
      } else {
        // 用服务端数据覆盖本地已存在条目，补齐头像等字段
        merged[idx] = tx;
      }
    });

    if (latestNew.length > 0) {
      merged.unshift(...latestNew);
    }

    transactions.value = merged;
    roomStore.setTransactions(transactions.value);
    // 同步总数与"是否还有更多"提示
    totalTransactions.value = transResult.pagination.total;
    hasMoreData.value = transactions.value.length < totalTransactions.value;
    
    // @ts-ignore
    if (import.meta.env.DEV && latestNew.length > 0) {
      console.log(`[增量合并] 成功合并 ${latestNew.length} 条新交易`);
    }
  } catch (e) {
    // 静默失败
    // @ts-ignore
    if (import.meta.env.DEV) {
      console.error('[增量合并] 失败:', e);
    }
  }
}

/**
 * 增量合并最新交易（用于实时事件）
 * 
 * 已包装防抖保护，500ms 内的重复调用将被自动忽略
 */
const mergeLatestTransactions = debounceTransactionMerge(_mergeLatestTransactionsCore);

/**
 * 全量重载交易记录（重置分页状态）
 * 用于数据断层或需要完全刷新的场景
 */
async function reloadAllTransactions() {
  try {
    // @ts-ignore
    if (import.meta.env.DEV) {
      console.log('[全量重载] 重置分页并重新加载交易记录');
    }
    
    // 重置分页状态
    currentPage.value = 1;
    hasMoreData.value = true;
    
    // 获取第1页数据
    const transResult = await getTransactions(roomId.value, 1, pageSize.value);
    transactions.value = transResult.transactions;
    totalTransactions.value = transResult.pagination.total;
    hasMoreData.value = transactions.value.length < totalTransactions.value;
    roomStore.setTransactions(transResult.transactions);
    
    // @ts-ignore
    if (import.meta.env.DEV) {
      console.log(`[全量重载] 完成，当前有 ${transactions.value.length}/${totalTransactions.value} 条记录`);
    }
  } catch (e) {
    console.error('[全量重载] 失败:', e);
    // 重载失败时不抛出异常，避免影响用户操作
  }
}

/**
 * 加载更多交易记录
 */
async function loadMoreTransactions() {
  if (isLoadingMore.value || !hasMoreData.value) {
    return;
  }

  try {
    isLoadingMore.value = true;
    const nextPage = currentPage.value + 1;

    // @ts-ignore
    if (import.meta.env.DEV) {
      console.log(`[房间详情] 加载第${nextPage}页交易记录`);
    }

    const transResult = await getTransactions(roomId.value, nextPage, pageSize.value);

    // 追加数据而不是替换
    transactions.value = [...transactions.value, ...transResult.transactions];
    currentPage.value = nextPage;

    // 检查是否还有更多数据
    hasMoreData.value = transactions.value.length < transResult.pagination.total;
    totalTransactions.value = transResult.pagination.total;

    // @ts-ignore
    if (import.meta.env.DEV) {
      console.log(`[房间详情] 已加载${transactions.value.length}/${totalTransactions.value}条记录`);
    }
  } catch (error) {
    console.error('加载更多交易记录失败:', error);
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    });
  } finally {
    isLoadingMore.value = false;
  }
}

// ========== 实时通道接入 ==========
let rt: { close: () => void } | null = null;

function setupRealtime() {
  if (!roomId.value) return;
  
  // 如果已有连接，先清理旧连接
  if (rt) {
    // @ts-ignore
    if (import.meta.env.DEV) {
      console.log('[房间详情] setupRealtime - 清理旧连接');
    }
    teardownRealtime();
  }
  
  // @ts-ignore
  if (import.meta.env.DEV) {
    console.log('[房间详情] setupRealtime - 建立新连接');
  }
  
  rt = connectRoomWS({
    roomId: roomId.value,
    getToken: () => userStore.token,
    onEvent: async (evt) => {
      switch (evt.type) {
        case 'member_joined':
          // 新成员加入：本地直接添加（0次 API 调用）
          if (evt.data?.member) {
            await updateMembersOnly({ type: 'join', member: evt.data.member });
          }
          break;
        case 'member_left':
          // 成员离开：本地直接移除（0次 API 调用）
          if (evt.data?.userId) {
            await updateMembersOnly({ type: 'leave', userId: evt.data.userId });
          }
          break;
        case 'member_updated':
        case 'settlement_created':
          // 成员更新/结算完成：刷新房间摘要（1次 API 调用）
          if (evt.type === 'settlement_created' && evt.data?.items && Array.isArray(evt.data.items)) {
            // 结算事件：显示结算结果弹窗
            settlementItems.value = evt.data.items;
            settlementResultVisible.value = true;
          }
          await refreshRoomSummary();
          break;
        case 'transaction_created':
          // 新交易：优先使用事件负载，缺失时再合并第一页
          if (evt.data?.transaction) {
            const t = evt.data.transaction;
            if (!transactions.value.some(x => x.id === t.id)) {
              transactions.value = [t, ...transactions.value];
              roomStore.setTransactions(transactions.value);
              totalTransactions.value = Math.max(totalTransactions.value + 1, transactions.value.length);
              hasMoreData.value = transactions.value.length < totalTransactions.value;
            }
          } else {
            await mergeLatestTransactions();
          }
          // 交易创建后，刷新成员余额（付款人和收款人的余额会变化）
          await refreshRoomSummary();
          break;
        case 'room_closed':
          // 房间关闭事件，刷新页面并提示
          uni.showToast({
            title: '房间已关闭',
            icon: 'none'
          });
          uni.switchTab({ url: '/pages/rooms/index' }); // 返回房间列表
          break;
      }
    },
    onStateChange: (state) => {
      wsState.value = state;
      showWsStatus.value = true;
      
      // 清除之前的定时器
      if (hideStatusTimer) {
        clearTimeout(hideStatusTimer as unknown as number);
        hideStatusTimer = null;
      }
      
      // 如果连接成功，轻量合并并在2秒后自动隐藏状态条
      if (state === 'connected') {
        // 若列表已有数据，避免重置分页，仅做增量校准
        if (transactions.value.length > 0) {
          mergeLatestTransactions().catch(e => {
            console.error('重连后合并数据失败:', e);
          });
        }
        
        // 刷新成员余额（重连期间可能错过了成员更新事件）
        refreshRoomSummary().catch(e => {
          console.error('重连后刷新房间摘要失败:', e);
        });
        
        // @ts-ignore
        hideStatusTimer = setTimeout(() => {
          showWsStatus.value = false;
        }, 2000) as unknown as number;
      }
    }
  });
}

async function refreshRoomAndTransactions(refreshTransactions: boolean) {
  try {
    const roomResult = await getRoomDetail(roomId.value);
    room.value = roomResult.room;
    members.value = roomResult.members;
    roomStore.setCurrentRoom(roomResult.room);
    roomStore.setMembers(roomResult.members);

    if (refreshTransactions) {
      // 如果是刷新交易记录，重置分页状态并重新加载
      currentPage.value = 1;
      hasMoreData.value = true;
      const transResult = await getTransactions(roomId.value, 1, pageSize.value);
      transactions.value = transResult.transactions;
      totalTransactions.value = transResult.pagination.total;
      hasMoreData.value = transactions.value.length < totalTransactions.value;
      roomStore.setTransactions(transResult.transactions);
    }
  } catch (e) {
    // 静默失败
  }
}

/**
 * 刷新房间摘要（成员+房间信息，不刷新交易分页）
 * 用于 member_updated、settlement_created、transaction_created 等事件
 * 
 * 已包装请求锁保护，并发调用时只执行第一个，其余自动跳过
 */
const refreshRoomSummary = withRoomSummaryLock(async () => {
  try {
    const roomResult = await getRoomDetail(roomId.value);
    room.value = roomResult.room;
    members.value = roomResult.members;
    roomStore.setCurrentRoom(roomResult.room);
    roomStore.setMembers(roomResult.members);
  } catch (e) {
    // 静默失败
  }
});

/**
 * 仅更新成员列表（不调用 API）
 * 用于 member_joined、member_left 等事件，直接更新本地数据
 */
async function updateMembersOnly(data?: { type: 'join' | 'leave'; member?: any; userId?: number }) {
  if (!data) return;
  if (data.type === 'join' && data.member) {
    // 添加新成员
    members.value = [...members.value, data.member];
    roomStore.setMembers(members.value);
  } else if (data.type === 'leave' && data.userId) {
    // 移除成员
    members.value = members.value.filter(m => m.user_id !== data.userId);
    roomStore.setMembers(members.value);
  }
}

function teardownRealtime() {
  // @ts-ignore
  if (import.meta.env.DEV) {
    console.log('[房间详情] teardownRealtime - 清理连接');
  }
  try { rt?.close(); } catch {}
  rt = null;
  wsState.value = 'disconnected';
}

/**
 * 显示成员选择器
 */
function showMemberSelector() {
  if (otherMembers.value.length === 0) {
    uni.showToast({
      title: '房间内没有其他成员',
      icon: 'none'
    });
    return;
  }
  memberSelectorVisible.value = true;
}

/**
 * 隐藏成员选择器
 */
function hideMemberSelector() {
  memberSelectorVisible.value = false;
}

/**
 * 选择收款人
 */
function selectPayee(member: RoomMember) {
  hideMemberSelector();
  openTransferDialog(member);
}

/**
 * 点击成员卡片进行转账
 */
function selectMemberForTransaction(member: RoomMember) {
  if (member.user_id === userStore.userInfo?.id) {
    uni.showToast({
      title: '不能给自己转账',
      icon: 'none'
    });
    return;
  }
  openTransferDialog(member);
}

/**
 * 打开转账弹窗
 */
function openTransferDialog(payee: RoomMember) {
  currentPayee.value = payee;
  transferAmount.value = '';
  transferDialogVisible.value = true;
  transferInputFocus.value = false;
  nextTick(() => {
    transferInputFocus.value = true;
  });
}

/**
 * 关闭转账弹窗
 */
function closeTransferDialog() {
  transferDialogVisible.value = false;
  transferInputFocus.value = false;
}

/**
 * 限制金额输入格式（最多两位小数）
 */
function handleAmountInput(e: any) {
  let value = e.detail?.value ?? transferAmount.value;
  value = String(value).replace(/[^\d.]/g, '');
  const parts = value.split('.');
  if (parts.length > 2) {
    value = parts[0] + '.' + parts.slice(1).join('');
  }
  if (parts.length === 2 && parts[1].length > 2) {
    value = parts[0] + '.' + parts[1].substring(0, 2);
  }
  transferAmount.value = value;
}

/**
 * 金额校验
 */
const isAmountValid = computed(() => {
  const num = parseFloat(transferAmount.value);
  return !isNaN(num) && num > 0;
});

/**
 * 提交转账
 */
async function submitTransfer() {
  if (!currentPayee.value || !isAmountValid.value) return;
  try {
    submitting.value = true;
    uni.showLoading({ title: '提交中...' });
    const newTx = await createTransaction(roomId.value, {
      payee_id: currentPayee.value.user_id,
      amount: parseFloat(transferAmount.value)
    });
    uni.hideLoading();
    uni.showToast({ title: '转账成功', icon: 'success' });
    transferDialogVisible.value = false;
    transferInputFocus.value = false;
    // 本地前插，避免全量刷新；随后由 WebSocket 事件校准
    if (newTx && !transactions.value.some(t => t.id === newTx.id)) {
      transactions.value = [newTx, ...transactions.value];
      roomStore.setTransactions(transactions.value);
      totalTransactions.value = Math.max(totalTransactions.value + 1, transactions.value.length);
      hasMoreData.value = transactions.value.length < totalTransactions.value;
    }
    // 刷新成员余额（已包装请求锁，与 WebSocket 事件并发调用时自动跳过）
    await refreshRoomSummary();
  } catch (error) {
    uni.hideLoading();
    console.error('转账失败:', error);
    uni.showToast({ title: '转账失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
}

// 监听键盘高度，避免弹窗被遮挡（小程序端支持）
// @ts-ignore
uni.onKeyboardHeightChange?.((res: any) => {
  // res.height 单位 px；这里简单转换为 rpx 近似：乘以 2（以 750 设计宽为基准）
  keyboardHeight.value = res?.height ? res.height * 2 : 0;
});

/**
 * 下拉刷新
 */
onPullDownRefresh(() => {
  loadRoomDetail().finally(() => {
    uni.stopPullDownRefresh();
  });
});

/**
 * 仅加载交易记录第一页（用于命中缓存场景）
 */
async function loadTransactionsFirstPage() {
  try {
    currentPage.value = 1;
    const transResult = await getTransactions(roomId.value, 1, pageSize.value);
    transactions.value = transResult.transactions;
    totalTransactions.value = transResult.pagination.total;
    hasMoreData.value = transactions.value.length < totalTransactions.value;
    roomStore.setTransactions(transResult.transactions);
  } catch (e) {
    // 静默失败
  }
}

/**
 * 配置微信分享
 */
// 已移除原生分享配置，改用小程序码与复制邀请

/**
 * 复制邀请码
 */
function copyInviteCode() {
  if (!room.value?.invite_code) return;
  uni.setClipboardData({
    data: room.value.invite_code,
    success: () => uni.showToast({ title: '邀请码已复制', icon: 'success' })
  });
}

/**
 * 复制完整邀请信息
 */
function copyInviteMessage() {
  if (!room.value) return;
  const text = `【记账邀请】
${userStore.userInfo?.nickname || '我'} 邀请你加入账本「${room.value.name}」

📋 邀请码：${room.value.invite_code}

💡 加入方式：
1️⃣ 在微信中搜索"记账小程序"
2️⃣ 进入小程序后输入邀请码：${room.value.invite_code}

或者让我发送小程序码给你，长按识别即可进入！`;
  uni.setClipboardData({ 
    data: text, 
    success: () => uni.showToast({ title: '邀请信息已复制，发送给好友吧', icon: 'success', duration: 2000 }) 
  });
}

/**
 * 生成分享海报（含小程序码）
 */
async function generatePoster() {
  if (!room.value) return;
  try {
    uni.showLoading({ title: '生成中...' });
    const { url } = await getRoomWxaCode(room.value.id, room.value.invite_code);
    posterWxaUrl.value = url;
    posterVisible.value = true;
  } catch (e: any) {
    uni.showToast({ title: e?.message || '生成失败', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
}

/**
 * 退出房间
 * 
 * 房主退出：转让房主给下一位成员（如有其他成员），否则删除房间
 * 非房主退出：直接退出，交易记录保留
 */
async function handleLeaveRoom() {
  if (!room.value) return;
  const owner = isOwner.value;

  // 根据身份和成员数量确定提示文案
  let tip = '';
  if (owner) {
    const hasOtherMembers = members.value.length > 1;
    tip = hasOtherMembers
      ? '您将转让房主身份给下一位成员并退出，确定继续？'
      : '您是最后一名成员，退出将删除房间，确定继续？';
  } else {
    tip = '退出后您的交易记录将保留，确定退出吗？';
  }

  uni.showModal({
    title: '确认',
    content: tip,
    success: async (res) => {
      if (!res.confirm) return;
      try {
        actionLoading.value = true;
        uni.showLoading({ title: '处理中...' });
        const result = await leaveRoom(roomId.value);
        
        // 退出成功后立即关闭 WebSocket 连接，避免收到 member_left 广播
        teardownRealtime();
        
        uni.hideLoading();

        // 根据后端返回的消息显示提示
        const successMsg = result?.message || (owner ? '已退出' : '退出成功');
        uni.showToast({ title: successMsg, icon: 'success' });

        setTimeout(() => {
          uni.switchTab({ url: '/pages/rooms/index' });
        }, 600);
      } catch (error: any) {
        uni.hideLoading();
        const msg = (error && error.message) || '操作失败';
        uni.showToast({ title: msg, icon: 'none' });
      } finally {
        actionLoading.value = false;
      }
    }
  });
}

/**
 * 结账（房主）
 */
async function handleSettlement() {
  if (!room.value) return;
  if (!isOwner) {
    uni.showToast({ title: '仅房主可结账', icon: 'none' });
    return;
  }
  try {
    actionLoading.value = true;
    uni.showLoading({ title: '结账中...' });
    const result = await createSettlement(roomId.value);
    settlementItems.value = (result && result.items) ? result.items : [];
    settlementResultVisible.value = true;
    uni.hideLoading();
  } catch (error: any) {
    uni.hideLoading();
    const msg = (error && error.message) || '结账失败';
    uni.showToast({ title: msg, icon: 'none' });
  } finally {
    actionLoading.value = false;
  }
}

/**
 * 确认结算结果 → 关闭弹窗并刷新数据
 */
async function confirmSettlementResult() {
  if (!room.value) return;
  try {
    // 关闭结算结果弹窗
    settlementResultVisible.value = false;

    // 房主调用关闭房间 API
    if (isOwner.value) {
      try {
        actionLoading.value = true;
        uni.showLoading({ title: '关闭房间中...' });
        await closeRoom(roomId.value);
        uni.hideLoading();

        // 关闭房间成功，显示提示并返回列表
        uni.showToast({ title: '房间已关闭', icon: 'success' });
        
        // 延迟返回，确保用户看到提示
        setTimeout(() => {
          uni.switchTab({ url: '/pages/rooms/index' });
        }, 500);
      } catch (error: any) {
        uni.hideLoading();
        const msg = (error && error.message) || '关闭房间失败';
        uni.showToast({ title: msg, icon: 'none' });
      } finally {
        actionLoading.value = false;
      }
    } else {
      // 非房主就直接返回
      uni.showToast({ title: '结算完成', icon: 'success' });
      setTimeout(() => {
        uni.switchTab({ url: '/pages/rooms/index' });
      }, 500);
    }
  } catch (error: any) {
    uni.hideLoading();
    const msg = (error && error.message) || '处理失败';
    uni.showToast({ title: msg, icon: 'none' });
  }
}
</script>

<style scoped>
.room-detail-container {
  /* 占满视口并作为列式布局，避免页面级滚动 */
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: #f5f5f5;
  padding: 20rpx;
}

.room-header {
  margin-bottom: 20rpx;
}

.room-info {
  padding: 10rpx 0;
}

.room-name {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 20rpx;
}

.invite-row {
  display: flex;
  align-items: center;
}

.invite-label {
  font-size: 26rpx;
  color: #999999;
  margin-right: 12rpx;
}

.invite-code {
  font-size: 28rpx;
  color: #07C160;
  font-weight: bold;
  margin-right: 20rpx;
}

.share-btn {
  background: #07C160;
  color: #ffffff;
  border: none;
  padding: 8rpx 24rpx;
}

.share-btn::after {
  border: none;
}

.share-btn--secondary {
  background: #06AE56;
}

.members-section {
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 20rpx;
  padding: 0 10rpx;
}

.actions-row {
  display: flex;
  justify-content: space-between;
  padding: 0 10rpx 16rpx;
}

.action-settle {
  background: #07C160;
  color: #ffffff;
  border: none;
}

.action-settle::after {
  border: none;
}

.action-leave {
  background: #f5f5f5;
  color: #ee0a24;
  border: none;
}

.action-leave::after {
  border: none;
}

.members-scroll {
  white-space: nowrap;
  width: 100%;
}

.members-row {
  display: flex;
  flex-direction: row;
}

.member-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 20rpx;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  width: 25%;
  min-width: 25%;
  position: relative;
}

/* 新增：成员卡片横向间距与两端留白 */
.members-row {
  padding: 0 16rpx;
}

.member-card {
  margin-right: 16rpx;
}

.member-card:last-child {
  margin-right: 0;
}

.member-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  margin-bottom: 16rpx;
}

.member-name {
  font-size: 28rpx;
  color: #333333;
}

.member-name-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  margin: 8rpx 0 12rpx;
}

.member-balance-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.owner-tag {
  font-size: 22rpx;
  color: #07C160;
  background: rgba(7, 193, 96, 0.1);
  border: 1rpx solid #07C160;
  padding: 2rpx 10rpx;
  border-radius: 8rpx;
}

.owner-badge {
  position: absolute;
  top: 7rpx;
  left: 8rpx;
  font-size: 22rpx;
  color: #07C160;
  background: #ffffff;
  /* border: 2rpx solid #07C160 ; */
  border-radius: 50%;
  width: 40rpx;
  height: 40rpx;
  /* line-height: 36rpx ; */
  /* text-align: center ; */
  display: flex;
  box-shadow: 0 2rpx 6rpx rgba(7, 193, 96, 0.15);
  align-items: center;
  justify-content: center;
}

.member-balance {
  font-size: 32rpx;
  font-weight: bold;
}

.transactions-section {
  /* 占据剩余空间供内部滚动 */
  flex: 1;
  min-height: 0;
  overflow: hidden;
  margin-bottom: 20rpx;
}

.empty-transactions {
  text-align: center;
  padding: 80rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
}

.transaction-list {
  background: #ffffff;
  border-radius: 16rpx;
  overflow: hidden;
}

/* 交易记录滚动容器：填满父级并为底部固定区域预留空间 */
.transactions-scroll {
  height: 100%;
  box-sizing: border-box;
  padding-bottom: calc(210rpx + env(safe-area-inset-bottom));
}

.transaction-item {
  padding: 30rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.transaction-item:last-child {
  border-bottom: none;
}

.transaction-users {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.user-avatar {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  margin-right: 12rpx;
}

.user-name {
  font-size: 28rpx;
  color: #333333;
}

.arrow {
  margin: 0 12rpx;
  font-size: 28rpx;
  color: #999999;
}

.transaction-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.transaction-amount {
  font-size: 32rpx;
  font-weight: bold;
  color: #07C160;
}

.transaction-time {
  font-size: 24rpx;
  color: #999999;
}

.fab {
  position: fixed;
  right: 30rpx;
  bottom: 180rpx;
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background: #07C160;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(7, 193, 96, 0.4);
  z-index: 100;
}

.fab-icon {
  font-size: 60rpx;
  color: #ffffff;
  font-weight: 300;
}

.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.member-selector {
  background: #ffffff;
  border-radius: 20rpx 20rpx 0 0;
  padding: 40rpx 30rpx;
  max-height: 80vh;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
}

.selector-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  text-align: center;
  margin-bottom: 30rpx;
}

.selector-list {
  max-height: 50vh;
  overflow-y: auto;
}

.selector-item {
  display: flex;
  align-items: center;
  padding: 24rpx 20rpx;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
  background: #f5f5f5;
}

.selector-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 24rpx;
}

.selector-name {
  font-size: 30rpx;
  color: #333333;
}

.selector-cancel {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: #f5f5f5;
  color: #666666;
  border-radius: 44rpx;
  font-size: 30rpx;
  margin-top: 20rpx;
  border: none;
}

.selector-cancel::after {
  border: none;
}

/* 底部操作栏 */
.bottom-action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -6rpx 18rpx rgba(0, 0, 0, 0.06);
  display: flex;
  gap: 20rpx;
  z-index: 95;
}

.bar-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  border: none;
}

.bar-btn::after {
  border: none;
}

.bar-btn--primary {
  background: #07C160;
  color: #ffffff;
}

.bar-btn--danger {
  background: #ffecec;
  color: #ee0a24;
}

/* 结算结果弹窗样式 */
.settlement-modal {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  width: 86%;
}

.settlement-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  text-align: center;
  margin-bottom: 20rpx;
}

.settlement-list {
  max-height: 50vh;
  overflow-y: auto;
}

.settlement-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.settlement-item:last-child {
  border-bottom: none;
}

.settlement-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  margin-right: 20rpx;
}

.settlement-name {
  flex: 1;
  font-size: 28rpx;
  color: #333333;
}

.settlement-amount {
  font-size: 30rpx;
  font-weight: bold;
}

.settlement-confirm {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: #07C160;
  color: #ffffff;
  border-radius: 44rpx;
  font-size: 30rpx;
  margin-top: 30rpx;
  border: none;
}

.settlement-confirm::after {
  border: none;
}

/* 转账输入弹窗样式 */
.transfer-modal {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  width: 86%;
  box-sizing: border-box;
}

.transfer-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  text-align: center;
}

.amount-row {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 32rpx 0;
}

.currency {
  font-size: 44rpx;
  font-weight: 600;
  color: #333333;
  margin-right: 12rpx;
}

.amount-input {
  font-size: 34rpx;
  text-align: center;
  width: 100%;
  border-bottom: 1rpx solid #eeeeee;
  padding: 10rpx 0;
}

.actions {
  display: flex;
  gap: 16rpx;
}

.btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  border: none;
}

.btn::after {
  border: none;
}

.btn.cancel {
  background: #f5f5f5;
  color: #666666;
}

.btn.confirm {
  background: #07C160;
  color: #ffffff;
}

.btn.confirm:disabled {
  background: #cccccc;
}

/* WebSocket 连接状态栏 */
.ws-status-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 8rpx 20rpx;
  text-align: center;
  font-size: 24rpx;
  z-index: 999;
  transition: all 0.3s ease;
}

.ws-status-bar--connecting {
  background: rgba(255, 193, 7, 0.9);
  color: #663c00;
}

.ws-status-bar--connected {
  background: rgba(7, 193, 96, 0.9);
  color: #ffffff;
}

.ws-status-bar--disconnected {
  background: rgba(238, 10, 36, 0.9);
  color: #ffffff;
}

.ws-status-text {
  line-height: 1.5;
}

/* 加载更多提示样式 */
.loading-more {
  padding: 30rpx 0;
  text-align: center;
  background: #ffffff;
}

.loading-text {
  font-size: 28rpx;
  color: #999999;
}

.no-more-data {
  padding: 30rpx 0;
  text-align: center;
  background: #ffffff;
}

.no-more-text {
  font-size: 28rpx;
  color: #999999;
}
</style>
