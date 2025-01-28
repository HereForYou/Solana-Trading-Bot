import { Context } from 'telegraf';

export interface SessionData {
  state: string;
  msgId?: number | undefined;
}

export interface MyContext extends Context {
  ctx: {};
  session: SessionData;
}

export interface TokenInfoType {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
  risk: number;
  price: any;
  poolAddress?: string;
}
