import { Request } from "express";
import { TotoDelegate } from "../../../controller/model/TotoDelegate";
import { UserContext } from "../../../controller/model/UserContext";
import { ExecutionContext } from "../../../controller/model/ExecutionContext";
import { RekoncileGame } from "../../../games/rekoncile/RekoncileGame";
import { extractAuthHeader } from "../../../util/AuthHeader";
import { CattieGame } from "../../../games/cattie/CattieGame";
import { TotoExpense } from "../../../api/ExpensesAPI";
import { ValidationError } from "../../../controller/validation/Validator";

export class ChooseCategory implements TotoDelegate {

    async do(req: Request, userContext: UserContext, execContext: ExecutionContext): Promise<any> {

        // Extract input data
        const expense = req.body.expense as TotoExpense
        const chosenCategory = req.body.chosenCategory

        // Validate input 
        if (!expense) throw new ValidationError(400, "Missing expense")
        if (!expense.id) throw new ValidationError(400, "Expense does not seem to have an id")
        if (!expense.amount) throw new ValidationError(400, "Missing amount in expense")
        if (!expense.category) throw new ValidationError(400, "Missing category in expense")
        if (!expense.currency) throw new ValidationError(400, "Missing currency in expense")
        if (!expense.date) throw new ValidationError(400, "Missing date in expense")
        if (!expense.description) throw new ValidationError(400, "Missing description in expense")
        if (!chosenCategory) throw new ValidationError(400, "No chosen category provided")

        // Instantiate the game
        const cattie = new CattieGame(userContext, execContext, String(extractAuthHeader(req)))

        // Save the user's pick and update the category
        return await cattie.onCategoryPickedByUser(expense, chosenCategory)

    }
}