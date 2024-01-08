import moment from "moment-timezone";
import { ExpensesAPI, TotoIncome } from "../../api/ExpensesAPI";
import { KudAPI, KudTransaction } from "../../api/KudAPI";
import { Game, GameStatus } from "../GameModel";

const AMOUNT_TOLERANCE = 100.0
const DATE_TOLERANCE = 10

const SCORE_PER_RECONCILIATION = 200

export class InkomeGame extends Game {

    async getGameStatus(): Promise<GameStatus> {

        const kudAPI = new KudAPI(this.userContext, this.execContext, this.authHeader)

        // Count the number of Reconciliations
        const { reconciliationCount } = await kudAPI.countReconciliations("income")

        // Calculate the score
        const score = reconciliationCount * SCORE_PER_RECONCILIATION

        // Calculate if the game is finished (even temporarily)
        const gameFinished = await this.isGameFinished()

        return {
            score: score,
            finished: gameFinished
        }
    }

    /**
     * Defines if the game is finished (even temporarily). 
     * 
     * This is done by:
     * 1. Checking the number of unreconciled incomes on the Kud API. If there are any, the game is not finished.
     */
    async isGameFinished(): Promise<boolean> {

        // Get the next transaction to reconcile
        const response = await new KudAPI(this.userContext, this.execContext, this.authHeader).getUnreconciledTransaction(0, "income")

        // Check if there are no more unreconciled transactions
        if (response == null || response.transactions == null || response.transactions.length == 0) return true;

        return false;

    }

    /**
     * Gets the next income transaction to reconcile. 
     * 
     * Follows the following steps: 
     * 1. Get an income transaction from Kud API that has not been reconciled
     * 2. Get all incomes with the same yearMonth
     * 3. Find possible matches and return them
     * 
     * @param roundsToSkip the mumber of transactions to skip
     * @returns the next income
     */
    async getNextTransaction(roundsToSkip: number): Promise<GetNextIncomeResponse | null> {

        // Get the next unreconciled income from Kud API
        const { transactions } = await new KudAPI(this.userContext, this.execContext, this.authHeader).getUnreconciledTransaction(roundsToSkip, "income")

        // If there are no transactions, you're done with the game
        if (!transactions || transactions.length == 0) return null;

        let kudIncome;

        // The income is the one at index "roundsToSkip"
        // If roundsToSkip = 0 then you'll get the only income, at position 0, otherwise you'll get the last payment in the returned array
        if (transactions.length == roundsToSkip + 1) kudIncome = transactions[roundsToSkip];
        // If there's not enough data, return the first available transaction
        else kudIncome = transactions[0];

        // 2. Call the Expenses API to get all expenses in the same year-month
        const totoResponse = await new ExpensesAPI(this.userContext, this.execContext, this.authHeader).getIncomes(kudIncome.yearMonth);

        const unfiliteredIncomes = totoResponse.incomes;

        // 3. Retrieve the list of reconciliations for the current year month, so that we can check that a candidate has not been already used
        const { reconciliations } = await new KudAPI(this.userContext, this.execContext, this.authHeader).getReconciliations(kudIncome.yearMonth)

        // Create a map of reconciliations, with the id of the toto expense as the key
        const reconciliationsMap = reconciliations.map((reconciliation) => { return reconciliation.toto_expense.id })

        // 4. Go through the expenses and find good candidates
        let candidates: TotoIncome[] = []

        for (let totoIncome of unfiliteredIncomes) {

            // Exclude, if already reconciled
            if (reconciliationsMap.includes(totoIncome.id!)) continue;

            // Calculate how "distant" the amount is, in percentage
            const amountDifference = Math.abs(totoIncome.amount - Math.abs(kudIncome.amount)) / totoIncome.amount;

            // Check that the amount is "close enough"
            if (amountDifference > AMOUNT_TOLERANCE) continue;

            // Calculate how "distant" the date is 
            const totoDate = moment(String(totoIncome.date), "YYYYMMDD")
            const kudDate = moment(String(kudIncome.date), "YYYYMMDD")

            const dateDifference = Math.abs(totoDate.diff(kudDate, "days"))

            // Check that the dates are close enough
            if (dateDifference > DATE_TOLERANCE) continue;

            // Add the expense to the possible candidates
            candidates.push(totoIncome);

        }

        return {
            kudIncome: kudIncome, 
            candidates: candidates
        }

    }

}

export interface GetNextIncomeResponse {
    kudIncome: KudTransaction,
    candidates: TotoIncome[]

}