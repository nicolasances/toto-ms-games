import moment from "moment-timezone";
import { Game, GameStatus } from "../GameModel";
import { ExpensesAPI } from "../../api/ExpensesAPI";
import { CattieMonthPicker } from "./CattieMonthPicker";
import { CattieRandomExpensePicker } from "./CattieRandomExpensePicker";

export class CattieGame extends Game {

    getGameStatus(): Promise<GameStatus> {
        throw new Error("Method not implemented.");
    }

    /**
     * Loads the game's next round
     * 
     * 
     */
    async nextRound(): Promise<CattieRound> {

        this.logger.compute(this.cid, `Loading next Cattie Round`)

        // Iterate over randomly picked months, looking for one that has expenses
        let expensesFound = false

        while (!expensesFound) {

            // Randomly choose a YearMonth to get an expense from
            const pickedYearMonth = new CattieMonthPicker().pickMonth("201802")

            this.logger.compute(this.cid, `Considering Year Month [${pickedYearMonth}]`)

            // Grab the expenses for that year month
            const { expenses } = await new ExpensesAPI(this.userContext, this.execContext, this.authHeader).getExpenses(pickedYearMonth);

            this.logger.compute(this.cid, `Got [${expenses?.length}] expenses for that month`)

            if (!expenses?.length) {
                expensesFound = false;
                continue;
            }

            // Randomly pick one of the expenses
            const chosenExpense = new CattieRandomExpensePicker().pickOneExpense(expenses)

            if (chosenExpense == null) {
                expensesFound = false;
                continue;
            }

            this.logger.compute(this.cid, `Picked expense [${JSON.stringify(chosenExpense)}]`)

            // Build the Cattie expense
            const chosenTx = new CattieTotoTx(chosenExpense.id!, chosenExpense.amount, chosenExpense.category!, chosenExpense.date, chosenExpense.description, chosenExpense.yearMonth!, chosenExpense.currency, chosenExpense.user)

            // Get a suggestion
            const suggestedCat = "VARIE"

            // Return the next rount 
            return new CattieRound(chosenTx, suggestedCat)

        }

        return new CattieRound(undefined, undefined, true);
    }
}

export class CattieTotoTx {

    id: string
    amount: number
    category: string
    date: string
    description: string
    yearMonth: number
    currency: string
    user: string

    constructor(id: string, amount: number, category: string, date: string, description: string, yearMonth: number, currency: string, user: string) {
        this.id = id
        this.amount = amount
        this.category = category
        this.date = date
        this.description = description
        this.yearMonth = yearMonth
        this.currency = currency
        this.user = user
    }

}

/**
 * Class describing a Round of Cattie
 */
export class CattieRound {

    transaction?: CattieTotoTx
    suggestedCategory?: string
    over: boolean

    constructor(transaction?: CattieTotoTx, suggestedCategory?: string, over: boolean = false) {
        this.transaction = transaction
        this.suggestedCategory = suggestedCategory
        this.over = over
    }

}