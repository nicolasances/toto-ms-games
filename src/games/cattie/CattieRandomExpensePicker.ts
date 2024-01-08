import { TotoExpense } from "../../api/ExpensesAPI";
import { CattieGameCache, CattieGameCacheExpenseWrapper } from "./CattieGameCache";

export class CattieRandomExpensePicker {

    gameCache: CattieGameCache;

    constructor(gameCache: CattieGameCache) {
        this.gameCache = gameCache
    }

    /**
     * This method will randomly pick one expense from the provided list of Toto Expenses
     * 
     * The random process picks expenses by picking miscategorized expenses with higher chance than correctly categorized expenses.
     * The ration is 2: P(picking miscategorized expense) = 2 * P(picking well categorized expense) 
     * 
     * @param expenses the expenses to pick from
     */
    pickOneExpense(): TotoExpense | null {

        // const expenses: CattieGameCacheExpenseWrapper[] = this.gameCache.getFreeExpenses()
        const wellCategorizedExpenses = this.gameCache.getFreeWellCategorizedExpenses()
        const miscategorizedExpenses = this.gameCache.getFreeMiscategorizedExpenses()
        
        // Check if there are enough expenses
        if (wellCategorizedExpenses == null || wellCategorizedExpenses.length == 0) return null;
        if (miscategorizedExpenses == null || miscategorizedExpenses.length == 0) return null;

        // Duplicate the miscategorized list, so that elements will be picked from it with higher probabilty (2x)
        const doubleMiscategorizedExpenses = miscategorizedExpenses.map(item => [item, item]).flat()

        // Concatenate the lists to have a unique list of expense to pick from 
        const expenses = doubleMiscategorizedExpenses.concat(wellCategorizedExpenses)

        // Define the max valid index to use
        const maxValidIndex = expenses.length - 1;

        // Pick an expense that IS NOT in the cache
        let i = 0;

        do {

            // Pick the next valid index
            const index = this.nextRandomIndex(maxValidIndex)

            // Extract the expense
            const expense = expenses[index]

            // Now flag that expense as "used"
            this.gameCache.useExpense(expense)

            // Return the expense
            return expense.expense;

        }
        while (i++ < 200)

        return null;

    }

    /**
     * This method randomly selects an index to pick from 
     * 
     * @param maxValidIndex an int specifying the max valid index that can be picked. 
     *                      -1 will be returned if to indices can be picked
     */
    nextRandomIndex(maxValidIndex: number) {

        // Check maxValidIndex
        if (maxValidIndex < 0) return -1;

        // Init the chosen index to -1
        let chosenIndex = -1

        // Make sure the iteration will stop
        const maxIterations = 2000
        let i = 0;

        // While it's negative, look for another index
        while (chosenIndex < 0) {

            // Pick an index
            chosenIndex = Math.floor(Math.random() * (maxValidIndex + 1))

            // Check iteration 
            if (i++ > maxIterations) break;

        }

        return chosenIndex;

    }
}