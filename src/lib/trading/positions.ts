import { Trade } from '@/types';

export interface PositionUpdate {
    id: string;
    shouldClose: boolean;
    closeReason?: 'STOP_LOSS' | 'TAKE_PROFIT';
    currentPrice: number;
    pnl: number;
    pnlPercent: number;
}

/**
 * Check if positions should be closed based on current prices
 */
export function checkPositions(
    positions: Trade[],
    currentPrices: Record<string, number>
): PositionUpdate[] {
    return positions.map(position => {
        const currentPrice = currentPrices[position.symbol];

        if (!currentPrice) {
            return {
                id: position.id,
                shouldClose: false,
                currentPrice: position.entry_price,
                pnl: 0,
                pnlPercent: 0
            };
        }

        let shouldClose = false;
        let closeReason: 'STOP_LOSS' | 'TAKE_PROFIT' | undefined;

        if (position.direction === 'LONG') {
            // Long position
            if (currentPrice <= position.stop_loss) {
                shouldClose = true;
                closeReason = 'STOP_LOSS';
            } else if (currentPrice >= position.take_profit) {
                shouldClose = true;
                closeReason = 'TAKE_PROFIT';
            }
        } else {
            // Short position
            if (currentPrice >= position.stop_loss) {
                shouldClose = true;
                closeReason = 'STOP_LOSS';
            } else if (currentPrice <= position.take_profit) {
                shouldClose = true;
                closeReason = 'TAKE_PROFIT';
            }
        }

        // Validate entry price to prevent division by zero
        if (position.entry_price <= 0) {
            console.error(`Invalid entry price for position ${position.id}: ${position.entry_price}`);
            return {
                id: position.id,
                shouldClose: false,
                currentPrice: position.entry_price,
                pnl: 0,
                pnlPercent: 0
            };
        }

        // Calculate P&L
        const priceDiff = position.direction === 'LONG'
            ? currentPrice - position.entry_price
            : position.entry_price - currentPrice;

        const pnl = (priceDiff / position.entry_price) * position.position_value;
        const pnlPercent = (priceDiff / position.entry_price) * 100;

        return {
            id: position.id,
            shouldClose,
            closeReason,
            currentPrice,
            pnl,
            pnlPercent
        };
    });
}

/**
 * Calculate trailing stop loss
 */
export function updateTrailingStop(
    position: Trade,
    currentPrice: number,
    trailingPercent: number = 0.02 // 2% trailing
): number {
    if (position.direction === 'LONG') {
        // For long, trailing stop moves up with price (only if price increases)
        if (currentPrice > position.entry_price) {
            // In profit: tighten stop loss
            const newStop = currentPrice * (1 - trailingPercent);
            return Math.max(position.stop_loss, newStop);
        }
        // In loss or at entry: don't modify stop loss
        return position.stop_loss;
    } else {
        // For short, trailing stop moves down with price (only if price decreases)
        if (currentPrice < position.entry_price) {
            // In profit: tighten stop loss
            const newStop = currentPrice * (1 + trailingPercent);
            return Math.min(position.stop_loss, newStop);
        }
        // In loss or at entry: don't modify stop loss
        return position.stop_loss;
    }
}
