import { TotoExpense } from "../../api/ExpensesAPI";

const cache = [] as string[]

export class CattieRandomExpensePicker {

    /**
     * This method will randomly pick one expense from the provided list of Toto Expenses
     * 
     * Important notes on what it does: 
     *  -   It caches the picked expenses, so that it won't pick them again anytime soon (at least in a gaming session). 
     * 
     * 
     * @param expenses the expenses to pick from
     */
    pickOneExpense(expenses: TotoExpense[]): TotoExpense | null {

        // Check if there are expenses
        if (expenses == null || expenses.length == 0) return null;

        // Define the max valid index to use
        const maxValidIndex = expenses.length - 1;

        // Pick an expense that IS NOT in the cache
        let i = 0;

        do {

            // Pick the next valid index
            const index = this.nextRandomIndex(maxValidIndex)

            // Extract the expense
            const expense = expenses[index]

            // If the expense is in the cache, go to the next
            if (cache.includes(expense.id!)) continue;

            // Cache the expense's id
            cache.push(expense.id!)

            // Return the expense
            return expense;

        }
        while (i++ < 100)

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