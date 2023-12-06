import moment from "moment-timezone";
import { ExpensesAPI, TotoExpense } from "../../api/ExpensesAPI";
import { KudAPI, KudTransaction } from "../../api/KudAPI";
import { Game, GameStatus } from "../GameModel";

const AMOUNT_TOLERANCE = 0.05;  // 5% difference
const DATE_TOLERANCE = 5;       // 5 days ahead or behind are "OK"

export class RekoncileGame extends Game {

    async getGameStatus(): Promise<GameStatus> {
        throw new Error("Method not implemented.");
    }

    pointsToPass(): number {
        return 10000;
    }

    /**
     * Retrieves the next transaction to reconcile in the game
     */
    async getNextTransaction(): Promise<GetNextTransactionResponse> {

        // 1. Call the Kud API to retrieve a transaction
        const response = await new KudAPI(this.userContext, this.execContext, this.authHeader).getUnreconciledTransaction()

        const kudPayment = response.payments[0];

        // 2. Call the Expenses API to get all expenses in the same year-month
        const totoResponse = await new ExpensesAPI(this.userContext, this.execContext, this.authHeader).getExpenses(kudPayment.yearMonth);

        const unfilteredExpenses = totoResponse.expenses;

        // 3. Go through the expenses and find good candidates
        let candidates = []

        for (let totoExpense of unfilteredExpenses) {

            // Calculate how "distant" the amount is, in percentage
            const amountDifference = Math.abs(totoExpense.amount - Math.abs(kudPayment.amount)) / totoExpense.amount;

            // Check that the amount is "close enough"
            if (amountDifference > AMOUNT_TOLERANCE) continue;

            // Calculate how "distant" the date is 
            const totoDate = moment(String(totoExpense.date), "YYYYMMDD")
            const kudDate = moment(String(kudPayment.date), "YYYYMMDD")

            const dateDifference = Math.abs(totoDate.diff(kudDate, "days"))

            // Check that the dates are close enough
            if (dateDifference > DATE_TOLERANCE) continue;

            // Add the expense to the possible candidates
            candidates.push(totoExpense);

        }

        return {
            kudPayment: kudPayment, 
            candidates: candidates
        }

    }

}

export interface GetNextTransactionResponse {
    kudPayment: KudTransaction, 
    candidates: TotoExpense[]
}