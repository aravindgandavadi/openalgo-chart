/**
 * Account Service
 * Trading account operations - funds, positions, orders, holdings
 */

import { makeApiRequest } from '../api/client';
import { ACCOUNT_ENDPOINTS } from '../api/endpoints';
import type {
  Funds,
  Position,
  Order,
  Holding,
  Trade,
  OrderBookResponse,
  HoldingsResponse,
  PingResponse,
} from '@/types/api';

/**
 * Ping API - Check connectivity and validate API key
 */
export async function ping(): Promise<PingResponse | null> {
  return makeApiRequest<PingResponse>(ACCOUNT_ENDPOINTS.PING, {}, {
    context: 'Ping',
    defaultValue: null,
    rawResponse: true,
  });
}

/**
 * Get Funds - Fetch account balance and margin details
 */
export async function getFunds(): Promise<Funds | null> {
  return makeApiRequest<Funds>(ACCOUNT_ENDPOINTS.FUNDS, {}, {
    context: 'Funds',
    defaultValue: null,
  });
}

/**
 * Get Position Book - Fetch current open positions
 */
export async function getPositionBook(): Promise<Position[]> {
  const result = await makeApiRequest<Position[]>(
    ACCOUNT_ENDPOINTS.POSITION_BOOK,
    {},
    {
      context: 'PositionBook',
      defaultValue: [],
    }
  );
  return result ?? [];
}

/**
 * Get Order Book - Fetch all orders with statistics
 */
export async function getOrderBook(): Promise<OrderBookResponse> {
  const result = await makeApiRequest<OrderBookResponse>(
    ACCOUNT_ENDPOINTS.ORDER_BOOK,
    {},
    {
      context: 'OrderBook',
      defaultValue: { orders: [], statistics: { total: 0, open: 0, completed: 0, rejected: 0 } },
      rawResponse: true,
    }
  );

  if (result && 'orders' in result) {
    return result;
  }

  return { orders: [], statistics: { total: 0, open: 0, completed: 0, rejected: 0 } };
}

/**
 * Get Trade Book - Fetch executed trades
 */
export async function getTradeBook(): Promise<Trade[]> {
  const result = await makeApiRequest<Trade[]>(
    ACCOUNT_ENDPOINTS.TRADE_BOOK,
    {},
    {
      context: 'TradeBook',
      defaultValue: [],
    }
  );
  return result ?? [];
}

/**
 * Get Holdings - Fetch long-term stock holdings with P&L
 */
export async function getHoldings(): Promise<HoldingsResponse> {
  const result = await makeApiRequest<HoldingsResponse>(
    ACCOUNT_ENDPOINTS.HOLDINGS,
    {},
    {
      context: 'Holdings',
      defaultValue: {
        holdings: [],
        statistics: {
          total_investment: 0,
          total_current_value: 0,
          total_pnl: 0,
          total_pnl_percent: 0,
          day_pnl: 0,
          day_pnl_percent: 0,
        },
      },
      rawResponse: true,
    }
  );

  if (result && 'holdings' in result) {
    return result;
  }

  return {
    holdings: [],
    statistics: {
      total_investment: 0,
      total_current_value: 0,
      total_pnl: 0,
      total_pnl_percent: 0,
      day_pnl: 0,
      day_pnl_percent: 0,
    },
  };
}

/**
 * Fetch all account data in parallel
 */
export async function fetchAllAccountData(): Promise<{
  funds: Funds | null;
  positions: Position[];
  orders: Order[];
  trades: Trade[];
  holdings: Holding[];
}> {
  const [funds, positions, orderBook, trades, holdingsResponse] = await Promise.all([
    getFunds(),
    getPositionBook(),
    getOrderBook(),
    getTradeBook(),
    getHoldings(),
  ]);

  return {
    funds,
    positions,
    orders: orderBook.orders,
    trades,
    holdings: holdingsResponse.holdings,
  };
}

export default {
  ping,
  getFunds,
  getPositionBook,
  getOrderBook,
  getTradeBook,
  getHoldings,
  fetchAllAccountData,
};
