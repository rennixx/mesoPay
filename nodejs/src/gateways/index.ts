/**
 * Gateway factory and index
 */

export { ZainCashClient } from './zaincash';
export { FastPayClient } from './fastpay';
export { FIBClient } from './fib';

export type {
  ZainCashConfig,
  ZainCashPaymentRequest,
  ZainCashPaymentResponse,
} from './zaincash';

export type {
  FastPayConfig,
  FastPayPaymentRequest,
  FastPayPaymentResponse,
  FastPayRefundRequest,
  FastPayRefundResponse,
} from './fastpay';

export type {
  FIBConfig,
  FIBTokenResponse,
  FIBTokenInfo,
  FIBPaymentRequest,
  FIBPaymentResponse,
} from './fib';
