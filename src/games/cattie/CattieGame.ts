import moment from "moment-timezone";
import { Game, GameStatus } from "../GameModel";
import { ExpensesAPI, TotoExpense } from "../../api/ExpensesAPI";
import { CattieMonthPicker } from "./CattieMonthPicker";
import { CattieRandomExpensePicker } from "./CattieRandomExpensePicker";
import { ExpCatAPI } from "../../api/ExpCatAPI";
import { CattieStore } from "../../store/CattieStore";
import { ValidationError } from "../../controller/validation/Validator";
import { TotoRuntimeError } from "../../controller/model/TotoRuntimeError";

const POINTS_PER_CATEGORY_PICKED = 10

export class CattieGame extends Game {

    async getGameStatus(): Promise<GameStatus> {

        let client;

        try {

            client = await this.config.getMongoClient();
            const db = client.db(this.config.getDBName());

            // Count the number of rounds the user played
            const count = await new CattieStore(db, this.config).countCategoryPicks(this.userEmail)

            // Calculate the score
            const playerScore = count * POINTS_PER_CATEGORY_PICKED

            // Return the status
            return { score: playerScore }


        } catch (error) {

            this.logger.compute(this.cid, `${error}`, "error")

            if (error instanceof ValidationError || error instanceof TotoRuntimeError) {
                throw error;
            }
            else {
                console.log(error);
                throw error;
            }

        }
        finally {
            if (client) client.close();
        }

    }

    /**
     * Loads the game's next round
     * ---------------------------------------------
     * 
     * The next round is loaded by picking randomly a yearMonth, and randomly picking 
     * a Toto Expense in that yearMonth. 
     * 
     * It will also use the ExpCat Model API to predict the category of that expense. 
     * 
     * The user will then be allowed to chose between the expense category, the predicted category or 
     * choose a category. 
     * 
     * @returns CattieRound 
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

            // Get the category predictions from ExpCat
            this.logger.compute(this.cid, `Getting a Category Prediction from ExpCat..`)

            const { prediction } = await new ExpCatAPI(this.userContext, this.execContext, this.authHeader).predictCategory(chosenTx.description)

            this.logger.compute(this.cid, `Getting a Category Prediction from ExpCat. Got ${JSON.stringify(prediction)}`)

            // Suggested Category
            let suggestedCat = "VARIE"

            if (prediction && prediction.length > 0) suggestedCat = prediction[0];

            // Return the next rount 
            return new CattieRound(chosenTx, suggestedCat)

        }

        return new CattieRound(undefined, undefined, true);
    }

    /**
     * Reacts to a user picking a category
     * ----------------------------------------------------------------------
     * 
     * This method can be called when a user has successfully picked 
     * the category for the round's expense. 
     * 
     * This method will 
     * - save the user's pick into DB
     * - update the Toto Expense through the Expenses API
     * 
     * @param expense the Toto Expense that the user was presented with
     * @param chosenCategory the category that the user has chosen
     * 
     */
    async onCategoryPickedByUser(expense: TotoExpense, chosenCategory: string) {

        let client;

        try {

            client = await this.config.getMongoClient();
            const db = client.db(this.config.getDBName());

            this.logger.compute(this.cid, `User chose category [${chosenCategory}] for expense [${expense.id!} - ${expense.description}]`)

            // Save the user's picked category
            const storeResult = await new CattieStore(db, this.config).saveCategoryPick(this.userEmail, expense, chosenCategory)

            // Update the Expense on the Expenses API
            await new ExpensesAPI(this.userContext, this.execContext, this.authHeader).updateExpenseCategory(expense.id!, chosenCategory)

            this.logger.compute(this.cid, `User selection saved and sent to Expenses API`)

            // Return 
            return { insertedId: storeResult.insertedId }


        } catch (error) {

            this.logger.compute(this.cid, `${error}`, "error")

            if (error instanceof ValidationError || error instanceof TotoRuntimeError) {
                throw error;
            }
            else {
                console.log(error);
                throw error;
            }

        }
        finally {
            if (client) client.close();
        }


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