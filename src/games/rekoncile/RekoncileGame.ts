import moment, { max } from "moment-timezone";
import { ExpensesAPI, TotoExpense } from "../../api/ExpensesAPI";
import { KudAPI, KudTransaction, Reconciliation, ReconciliationTotoExpense } from "../../api/KudAPI";
import { Game, GameStatus } from "../GameModel";
import { extractAuthHeader } from "../../util/AuthHeader";

const AMOUNT_TOLERANCE = 0.05;  // 5% difference
const DATE_TOLERANCE = 5;       // 5 days ahead or behind are "OK"

const SCORE_PER_RECONCILIATION = 5;

export class RekoncileGame extends Game {

    /**
     * This method returns the Rekoncile Game Status
     * 
     * @returns Promise<GameStatus>
     * 
     * Scoring is calculated as follows: 
     *  - The Kud API is called to retrieve the count of Reconciliation records for the user
     *  - The Kud API is called to retrieve the count of Kud records for the user
     *  - The Score is calculated as SCORE_PER_RECONCILIATION * num_of_reconciliation_records
     *  - The Max Score is calculated as SCORE_PER_RECONCILIATION * num_of_kud_records
     */
    async getGameStatus(): Promise<GameStatus> {

        const kudAPI = new KudAPI(this.userContext, this.execContext, this.authHeader)

        // Count the number of Reconciliations
        const { reconciliationCount } = await kudAPI.countReconciliations()

        // Count the number of Transactions
        const { count } = await kudAPI.countKudTransactions()

        // Check if score is 0
        if (count == 0) return {
            score: 0,
        }

        // Calculate the score
        const score = reconciliationCount * SCORE_PER_RECONCILIATION

        return {
            score: score,
        }

    }

    /**
     * Retrieves the next transaction to reconcile in the game.
     * 
     * This method goes through these steps: 
     * 
     * 1.   Get the next transaction to reconcile from the Kud API. 
     *      Skip some of the payments, if the user has passed on some transactions
     * 
     * 2.   Get the Toto Expenses for the year month
     * 
     * 3.   Retrieve the list of reconciliations for the current year month. 
     *      Only the Toto Expense Ids are necessary. 
     *      This is used to verify that candidates are not already part of a reconciliation in that month. 
     * 
     * 4.   Go through the Toto Expenses and keep good candidates (approximately matching amounts and date)
     *      Exclude candidates that are already part of a reconciliation
     * 
     */
    async getNextTransaction(roundsToSkip: number): Promise<GetNextTransactionResponse | null> {

        // 1. Call the Kud API to retrieve a transaction
        const response = await new KudAPI(this.userContext, this.execContext, this.authHeader).getUnreconciledTransaction(roundsToSkip)

        // If there are no more payments available, you're done
        if (response.payments.length == 0) return null;

        let kudPayment;

        // The payment is the one at index "roundsToSkip"
        // If roundsToSkip = 0 then you'll get the only payment, at position 0, otherwise you'll get the last payment in the returned array
        if (response.payments.length == roundsToSkip + 1) kudPayment = response.payments[roundsToSkip];
        // If there's not enough data, return the first available transaction
        else kudPayment = response.payments[0];


        // 2. Call the Expenses API to get all expenses in the same year-month
        const totoResponse = await new ExpensesAPI(this.userContext, this.execContext, this.authHeader).getExpenses(kudPayment.yearMonth);

        const unfilteredExpenses = totoResponse.expenses;

        // 3. Retrieve the list of reconciliations for the current year month, so that we can check that a candidate has not been already used
        const { reconciliations } = await new KudAPI(this.userContext, this.execContext, this.authHeader).getReconciliations(kudPayment.yearMonth)

        // Create a map of reconciliations, with the id of the toto expense as the key
        const reconciliationsMap = reconciliations.map((reconciliation) => { return reconciliation.toto_expense.id })

        // 4. Go through the expenses and find good candidates
        let candidates = []

        for (let totoExpense of unfilteredExpenses) {

            // Exclude, if already reconciled
            if (reconciliationsMap.includes(totoExpense.id!)) continue;

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