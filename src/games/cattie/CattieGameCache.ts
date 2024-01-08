import { TotoExpense } from "../../api/ExpensesAPI";

/**
 * Wrapper for the Toto Expense, that tracks cache-related attributes.
 * 
 * It tracks the used flag to track whether the expense has already been used
 * in this gaming session.
 * 
 * It also tracks the predicted category and whether the category is miscategorized 
 * (category != predicted category)
 */
export class CattieGameCacheExpenseWrapper {

    expense: TotoExpense
    used: boolean = false
    predictedCategory: string
    miscategorized: boolean

    constructor(expense: TotoExpense, predictedCategory: string) {
        this.expense = expense
        this.predictedCategory = predictedCategory
        this.miscategorized = expense.category != predictedCategory
    }
}

/**
 * Game Cache
 * 
 * The goal of this cache is to maintain the list of expenses being used in this game session. 
 * For each expense, it also maintains a "flag" that states whether this expense has been or not used
 */
export class CattieGameCache {

    expenses: CattieGameCacheExpenseWrapper[]

    constructor() {
        this.expenses = []
    }

    /**
     * Resets the cache
     */
    reset() {
        this.expenses = []
    }

    /**
     * Caches the expenses and predicted categories
     * 
     * It is assumed that the two lists have the SAME INDEX.
     * 
     * @param expenses expenses to cache
     * @param predictedCategories the ordered list of category predictions for the above expenses. 
     */
    cacheExpenses(expenses: TotoExpense[], predictedCategories: string[]) {

        this.expenses = []

        for (let i = 0; i < expenses.length; i++) {

            const expense = expenses[i]
            const predictedCategory = predictedCategories[i]

            this.expenses.push(new CattieGameCacheExpenseWrapper(expense, predictedCategory))

        }
    }

    /**
     * Sets the provided expense as used (in the cache)
     * 
     * This is to avoid that the expense can be picked again
     * 
     * @param expense the used expense
     */
    useExpense(expense: CattieGameCacheExpenseWrapper) {

        for (let cachedExpense of this.expenses) {
            if (cachedExpense.expense.id == expense.expense.id) {
                cachedExpense.used = true
                break;
            }
        }

    }

    /**
     * Returns the list of free expenses 
     * 
     * Free expenses are expenses that have not yet been used in this session of the game. 
     */
    getFreeExpenses(): CattieGameCacheExpenseWrapper[] {

        let expenses = []

        for (let expenseWrapper of this.expenses) {

            if (expenseWrapper.used == false) expenses.push(expenseWrapper)

        }

        return expenses;

    }

    /**
     * Returns the list of miscategorized unused expenses
     * 
     * @returns the list of miscategorized unused expenses
     */
    getFreeMiscategorizedExpenses(): CattieGameCacheExpenseWrapper[] {

        let expenses = []

        for (let expenseWrapper of this.expenses) {
            if (expenseWrapper.used == false && expenseWrapper.miscategorized === true) expenses.push(expenseWrapper)
        }

        return expenses;

    }

    /**
     * Returns the list of well categorized unused expenses
     * 
     * @returns the list of well categorized unused expenses
     */
    getFreeWellCategorizedExpenses(): CattieGameCacheExpenseWrapper[] {

        let expenses = []

        for (let expenseWrapper of this.expenses) {
            if (expenseWrapper.used == false && expenseWrapper.miscategorized === false) expenses.push(expenseWrapper)
        }

        return expenses;

    }

}
